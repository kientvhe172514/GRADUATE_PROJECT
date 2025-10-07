namespace Zentry.Modules.NotificationService.Infrastructure.Push;

public interface IFcmSender
{
    Task SendPushNotificationAsync(
        Guid recipientUserId,
        string title,
        string body,
        IReadOnlyDictionary<string, string>? data,
        CancellationToken cancellationToken);
}