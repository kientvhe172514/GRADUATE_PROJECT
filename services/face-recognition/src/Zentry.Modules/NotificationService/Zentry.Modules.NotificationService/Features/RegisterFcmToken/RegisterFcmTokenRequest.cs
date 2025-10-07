namespace Zentry.Modules.NotificationService.Features.RegisterFcmToken;

/// <summary>
///     Request để đăng ký FCM token cho device
/// </summary>
public class RegisterFcmTokenRequest
{
    /// <summary>
    ///     ID của user
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    ///     Android ID của device (để tìm device existing)
    /// </summary>
    public string AndroidId { get; set; } = string.Empty;

    /// <summary>
    ///     FCM Token từ Firebase
    /// </summary>
    public string FcmToken { get; set; } = string.Empty;

    /// <summary>
    ///     Platform của device (android/ios)
    /// </summary>
    public string Platform { get; set; } = string.Empty;

    /// <summary>
    ///     Tên device (optional)
    /// </summary>
    public string? DeviceName { get; set; }

    /// <summary>
    ///     Model của device (optional)
    /// </summary>
    public string? Model { get; set; }

    /// <summary>
    ///     Manufacturer của device (optional)
    /// </summary>
    public string? Manufacturer { get; set; }

    /// <summary>
    ///     OS Version (optional)
    /// </summary>
    public string? OsVersion { get; set; }

    /// <summary>
    ///     App Version (optional)
    /// </summary>
    public string? AppVersion { get; set; }
}