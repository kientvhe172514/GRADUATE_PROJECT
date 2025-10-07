namespace Zentry.SharedKernel.Contracts.Events;

/// <summary>
///     Enum để xác định loại thông báo sẽ được gửi đi.
/// </summary>
public enum NotificationType
{
    /// <summary>
    ///     Chỉ lưu vào CSDL để hiển thị trong ứng dụng.
    /// </summary>
    InApp,

    /// <summary>
    ///     Chỉ đẩy thông báo qua dịch vụ push (ví dụ: FCM).
    /// </summary>
    Push,

    /// <summary>
    ///     Gửi cả hai loại: In-app và Push.
    /// </summary>
    All
}