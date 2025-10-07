using MassTransit;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Zentry.Modules.NotificationService.Entities;
using Zentry.Modules.NotificationService.Features.ReceiveAttendanceNotification;
using Zentry.Modules.NotificationService.Infrastructure.Push;
using Zentry.Modules.NotificationService.Persistence.Repository;
using Zentry.SharedKernel.Contracts.Events;

namespace Zentry.Modules.NotificationService.Controllers;

[ApiController]
[Route("api/notifications")]
public class NotificationsController(
    IMediator mediator,
    IBus bus,
    INotificationRepository notificationRepository,
    IFcmSender fcmSender)
    : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<Notification>>> GetNotifications(
        [FromQuery] Guid userId,
        CancellationToken cancellationToken,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var query = new ReceiveAttendanceNotificationServiceQuery(userId, page, pageSize);
        var notifications = await mediator.Send(query, cancellationToken);
        return Ok(notifications);
    }

    /// <summary>
    ///     Test endpoint để send notification trực tiếp (for testing purposes only)
    /// </summary>
    [HttpPost("send-test")]
    public async Task<IActionResult> SendTestNotification([FromBody] SendTestNotificationRequest request,
        CancellationToken cancellationToken)
    {
        var notificationEvent = new NotificationCreatedEvent
        {
            Title = request.Title,
            Body = request.Body,
            RecipientUserId = request.RecipientUserId,
            Type = request.Type,
            Data = request.Data
        };

        await bus.Publish(notificationEvent, cancellationToken);

        return Ok(new
        {
            success = true,
            message = "Test notification sent successfully",
            recipientUserId = request.RecipientUserId
        });
    }

    /// <summary>
    ///     Test FCM integration
    /// </summary>
    [HttpPost("test-fcm")]
    public async Task<IActionResult> TestFcm([FromBody] TestFcmRequest request, CancellationToken cancellationToken)
    {
        try
        {
            // Check if FCM is initialized
            if (fcmSender is FcmSender fcmSenderImpl && !fcmSenderImpl.IsFirebaseInitialized)
                return BadRequest(new
                {
                    success = false,
                    message = "Firebase FCM not initialized. Check server logs for details."
                });

            // Test push notification
            var notificationEvent = new NotificationCreatedEvent
            {
                Title = "Test FCM",
                Body = "This is a test push notification from Zentry server",
                RecipientUserId = request.RecipientUserId,
                Type = NotificationType.Push,
                Data = new Dictionary<string, string>
                {
                    ["type"] = "TEST_FCM",
                    ["timestamp"] = DateTime.UtcNow.ToString("O"),
                    ["testId"] = Guid.NewGuid().ToString()
                }
            };

            await bus.Publish(notificationEvent, cancellationToken);

            return Ok(new
            {
                success = true,
                message = "Test FCM notification sent successfully",
                recipientUserId = request.RecipientUserId,
                timestamp = DateTime.UtcNow,
                fcmStatus = "initialized"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                success = false,
                message = "Internal server error",
                error = ex.Message
            });
        }
    }

    /// <summary>
    ///     Check FCM status
    /// </summary>
    [HttpGet("fcm-status")]
    public IActionResult GetFcmStatus()
    {
        var isInitialized = fcmSender is FcmSender fcmSenderImpl && fcmSenderImpl.IsFirebaseInitialized;

        return Ok(new
        {
            success = true,
            fcmInitialized = isInitialized,
            timestamp = DateTime.UtcNow,
            message = isInitialized ? "FCM is ready" : "FCM is not initialized"
        });
    }

    /// <summary>
    ///     Mark notification as read
    /// </summary>
    [HttpPut("{notificationId}/read")]
    public async Task<IActionResult> MarkAsRead(Guid notificationId, CancellationToken cancellationToken)
    {
        var notification = await notificationRepository.GetByIdAsync(notificationId, cancellationToken);
        if (notification == null) return NotFound(new { success = false, message = "Notification not found" });

        notification.MarkAsRead();
        await notificationRepository.SaveChangesAsync(cancellationToken);

        return Ok(new { success = true, message = "Notification marked as read" });
    }

    /// <summary>
    ///     Mark all notifications as read for a user
    /// </summary>
    [HttpPost("mark-all-read")]
    public async Task<IActionResult> MarkAllAsRead([FromQuery] Guid userId, CancellationToken cancellationToken)
    {
        try
        {
            var notifications = await notificationRepository.GetUnreadByUserIdAsync(userId, cancellationToken);

            foreach (var notification in notifications) notification.MarkAsRead();

            if (notifications.Any())
            {
                await notificationRepository.UpdateRangeAsync(notifications, cancellationToken);
                await notificationRepository.SaveChangesAsync(cancellationToken);
            }

            return Ok(new
            {
                success = true,
                message = $"Marked {notifications.Count()} notifications as read",
                userId,
                count = notifications.Count()
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                success = false,
                message = "Internal server error: " + ex.Message
            });
        }
    }

    /// <summary>
    ///     Delete a notification
    /// </summary>
    [HttpDelete("{notificationId}")]
    public async Task<IActionResult> DeleteNotification(Guid notificationId, CancellationToken cancellationToken)
    {
        try
        {
            var notification = await notificationRepository.GetByIdAsync(notificationId, cancellationToken);

            if (notification == null) return NotFound(new { message = "Notification not found" });

            await notificationRepository.DeleteAsync(notification, cancellationToken);
            await notificationRepository.SaveChangesAsync(cancellationToken);

            return Ok(new
            {
                success = true,
                message = "Notification deleted",
                notificationId
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                success = false,
                message = "Internal server error: " + ex.Message
            });
        }
    }

    /// <summary>
    ///     Delete all notifications for a user
    /// </summary>
    [HttpDelete("user/{userId}")]
    public async Task<IActionResult> DeleteAllNotifications(Guid userId, CancellationToken cancellationToken)
    {
        try
        {
            var notifications = await notificationRepository.GetByUserIdAsync(userId, cancellationToken);

            if (notifications.Any())
            {
                await notificationRepository.DeleteRangeAsync(notifications, cancellationToken);
                await notificationRepository.SaveChangesAsync(cancellationToken);
            }

            return Ok(new
            {
                success = true,
                message = $"Deleted {notifications.Count()} notifications",
                userId,
                count = notifications.Count()
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                success = false,
                message = "Internal server error: " + ex.Message
            });
        }
    }

    /// <summary>
    ///     Get notification count for a user
    /// </summary>
    [HttpGet("count")]
    public async Task<IActionResult> GetNotificationCount([FromQuery] Guid userId, CancellationToken cancellationToken)
    {
        try
        {
            var totalCount = await notificationRepository.GetCountByUserIdAsync(userId, cancellationToken);
            var unreadCount = await notificationRepository.GetUnreadCountByUserIdAsync(userId, cancellationToken);

            return Ok(new
            {
                userId,
                total = totalCount,
                unread = unreadCount,
                read = totalCount - unreadCount
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                success = false,
                message = "Internal server error: " + ex.Message
            });
        }
    }
}

public class SendTestNotificationRequest
{
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public Guid RecipientUserId { get; set; }
    public NotificationType Type { get; set; }
    public Dictionary<string, string>? Data { get; set; }
}

public class TestFcmRequest
{
    public Guid RecipientUserId { get; set; }
}