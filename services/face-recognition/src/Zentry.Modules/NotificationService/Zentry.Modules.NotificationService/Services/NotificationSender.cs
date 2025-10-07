using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Zentry.Modules.NotificationService.Application.Services;
using Zentry.Modules.NotificationService.Entities;
using Zentry.Modules.NotificationService.Hubs;
using Zentry.Modules.NotificationService.Infrastructure.Push;
using Zentry.Modules.NotificationService.Persistence.Repository;
using Zentry.SharedKernel.Contracts.Events;

namespace Zentry.Modules.NotificationService.Infrastructure.Services;

/// <summary>
///     Triển khai dịch vụ gửi thông báo, điều phối giữa việc lưu và đẩy.
/// </summary>
public class NotificationSender(
    IFcmSender fcmSender,
    INotificationRepository notificationRepository,
    IHubContext<NotificationHub> hubContext,
    ILogger<NotificationSender> logger) : INotificationSender
{
    public async Task SendNotificationAsync(NotificationCreatedEvent notificationEvent,
        CancellationToken cancellationToken)
    {
        var tasks = new List<Task>();

        // 1. Gửi In-App Notification (lưu vào CSDL)
        if (notificationEvent.Type is NotificationType.InApp or NotificationType.All)
            tasks.Add(SaveInAppNotification(notificationEvent, cancellationToken));

        // 2. Gửi Push Notification qua FCM
        if (notificationEvent.Type is NotificationType.Push or NotificationType.All)
            tasks.Add(fcmSender.SendPushNotificationAsync(
                notificationEvent.RecipientUserId,
                notificationEvent.Title,
                notificationEvent.Body,
                notificationEvent.Data,
                cancellationToken));

        await Task.WhenAll(tasks);
    }

    private async Task SaveInAppNotification(NotificationCreatedEvent notificationEvent,
        CancellationToken cancellationToken)
    {
        try
        {
            // ✅ Thêm: Extract deeplink từ Data dictionary
            string? deeplink = null;
            if (notificationEvent.Data != null && notificationEvent.Data.ContainsKey("deeplink"))
                deeplink = notificationEvent.Data["deeplink"];

            var notification = Notification.Create(
                notificationEvent.RecipientUserId,
                notificationEvent.Title,
                notificationEvent.Body,
                notificationEvent.Type, // ✅ Thêm: Truyền Type
                deeplink, // ✅ Thêm: Truyền Deeplink
                notificationEvent.Data);

            await notificationRepository.AddAsync(notification, cancellationToken);
            await notificationRepository.SaveChangesAsync(cancellationToken);

            logger.LogInformation("In-app notification for user {UserId} saved to database.",
                notificationEvent.RecipientUserId);

            // Send real-time notification via SignalR
            await SendRealTimeNotification(notification, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to save in-app notification for user {UserId}",
                notificationEvent.RecipientUserId);
            // Không re-throw để không ảnh hưởng đến việc gửi push notification nếu có
        }
    }

    private async Task SendRealTimeNotification(Notification notification, CancellationToken cancellationToken)
    {
        try
        {
            var userGroupName = $"user_{notification.RecipientUserId}";

            var realTimeNotification = new
            {
                id = notification.Id,
                title = notification.Title,
                body = notification.Body,
                recipientUserId = notification.RecipientUserId,
                createdAt = notification.CreatedAt,
                isRead = notification.IsRead,
                type = notification.Type, // ✅ Thêm: Include Type
                deeplink = notification.Deeplink, // ✅ Thêm: Include Deeplink
                data = notification.Data
            };

            await hubContext.Clients.Group(userGroupName)
                .SendAsync("NewNotification", realTimeNotification, cancellationToken);

            logger.LogInformation("Real-time notification sent to user {UserId} via SignalR.",
                notification.RecipientUserId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send real-time notification for user {UserId}",
                notification.RecipientUserId);
            // Don't throw - real-time notification failure shouldn't break the main flow
        }
    }
}