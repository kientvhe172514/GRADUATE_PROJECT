namespace Zentry.SharedKernel.Contracts.Events;

/// <summary>
///     Sự kiện được phát ra khi một thông báo mới cần được gửi đi.
///     Các module khác sẽ publish sự kiện này, và NotificationService sẽ lắng nghe.
/// </summary>
public record NotificationCreatedEvent
{
    /// <summary>
    ///     Tiêu đề của thông báo.
    /// </summary>
    public required string Title { get; init; }

    /// <summary>
    ///     Nội dung chi tiết của thông báo.
    /// </summary>
    public required string Body { get; init; }

    /// <summary>
    ///     ID của người dùng sẽ nhận thông báo.
    /// </summary>
    public required Guid RecipientUserId { get; init; }

    /// <summary>
    ///     Loại thông báo (InApp, Push, hoặc cả hai).
    /// </summary>
    public NotificationType Type { get; init; }

    /// <summary>
    ///     (Tùy chọn) Dữ liệu bổ sung dưới dạng key-value để gửi kèm trong push notification.
    ///     Ví dụ: { "screen": "ScheduleDetail", "scheduleId": "..." }
    /// </summary>
    public Dictionary<string, string>? Data { get; init; }
}