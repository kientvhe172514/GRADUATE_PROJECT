namespace Zentry.Modules.NotificationService.Features.RegisterFcmToken;

/// <summary>
///     Response khi đăng ký FCM token thành công
/// </summary>
public class RegisterFcmTokenResponse
{
    /// <summary>
    ///     ID của device (có thể là existing hoặc mới tạo)
    /// </summary>
    public Guid DeviceId { get; set; }

    /// <summary>
    ///     ID của user
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    ///     Android ID của device
    /// </summary>
    public string AndroidId { get; set; } = string.Empty;

    /// <summary>
    ///     FCM Token đã được đăng ký
    /// </summary>
    public string FcmToken { get; set; } = string.Empty;

    /// <summary>
    ///     Platform của device
    /// </summary>
    public string Platform { get; set; } = string.Empty;

    /// <summary>
    ///     Trạng thái đăng ký
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    ///     Thời gian đăng ký
    /// </summary>
    public DateTime RegisteredAt { get; set; }

    /// <summary>
    ///     Thông báo về kết quả đăng ký
    /// </summary>
    public string Message { get; set; } = string.Empty;
}