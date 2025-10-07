using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.NotificationService.Features.RegisterFcmToken;

/// <summary>
///     Command để đăng ký FCM token cho device
/// </summary>
public class RegisterFcmTokenCommand : ICommand<RegisterFcmTokenResponse>
{
    public RegisterFcmTokenCommand(
        Guid userId,
        string androidId,
        string fcmToken,
        string platform,
        string? deviceName = null,
        string? model = null,
        string? manufacturer = null,
        string? osVersion = null,
        string? appVersion = null)
    {
        UserId = userId;
        AndroidId = androidId;
        FcmToken = fcmToken;
        Platform = platform;
        DeviceName = deviceName;
        Model = model;
        Manufacturer = manufacturer;
        OsVersion = osVersion;
        AppVersion = appVersion;
    }

    public Guid UserId { get; }
    public string AndroidId { get; }
    public string FcmToken { get; }
    public string Platform { get; }
    public string? DeviceName { get; }
    public string? Model { get; }
    public string? Manufacturer { get; }
    public string? OsVersion { get; }
    public string? AppVersion { get; }
}