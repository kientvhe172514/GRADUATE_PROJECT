using MassTransit;
using Microsoft.Extensions.Logging;
using Zentry.Modules.NotificationService.Application.Services;
using Zentry.SharedKernel.Contracts.Events;

namespace Zentry.Modules.NotificationService.Application.EventHandlers;

/// <summary>
///     Lắng nghe sự kiện NotificationCreatedEvent và điều phối việc gửi thông báo.
/// </summary>
public class NotificationCreatedConsumer(
    ILogger<NotificationCreatedConsumer> logger,
    INotificationSender notificationSender) : IConsumer<NotificationCreatedEvent>
{
    /// <summary>
    ///     Xử lý message từ MassTransit.
    /// </summary>
    public async Task Consume(ConsumeContext<NotificationCreatedEvent> context)
    {
        var notificationEvent = context.Message;
        logger.LogInformation("Received NotificationCreatedEvent for user {RecipientUserId}",
            notificationEvent.RecipientUserId);

        try
        {
            await notificationSender.SendNotificationAsync(notificationEvent, context.CancellationToken);
            logger.LogInformation("Successfully processed notification for user {RecipientUserId}",
                notificationEvent.RecipientUserId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing notification for user {RecipientUserId}",
                notificationEvent.RecipientUserId);
            // Quyết định re-throw để MassTransit có thể retry hoặc đưa vào error queue
            throw;
        }
    }
}