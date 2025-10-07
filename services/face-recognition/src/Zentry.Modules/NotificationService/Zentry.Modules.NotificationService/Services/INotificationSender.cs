using Zentry.SharedKernel.Contracts.Events;

namespace Zentry.Modules.NotificationService.Application.Services;

/// <summary>
///     Trừu tượng hóa việc gửi thông báo.
///     Tầng Infrastructure sẽ triển khai interface này.
/// </summary>
public interface INotificationSender
{
    /// <summary>
    ///     Gửi một thông báo dựa trên thông tin từ event.
    /// </summary>
    /// <param name="notificationEvent">Dữ liệu thông báo.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Task.</returns>
    Task SendNotificationAsync(NotificationCreatedEvent notificationEvent, CancellationToken cancellationToken);
}