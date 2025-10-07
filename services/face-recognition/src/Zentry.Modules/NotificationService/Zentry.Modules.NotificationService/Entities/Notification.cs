using System.Text.Json;
using Zentry.SharedKernel.Contracts.Events;
using Zentry.SharedKernel.Domain;

namespace Zentry.Modules.NotificationService.Entities;

/// <summary>
///     Đại diện cho một thông báo trong hệ thống.
/// </summary>
public class Notification : Entity<Guid>
{
    // Private constructor for EF Core
    private Notification() : base(Guid.NewGuid())
    {
    }

    private Notification(
        Guid id,
        Guid recipientUserId,
        string title,
        string body,
        NotificationType type,
        string? deeplink,
        string? data) : base(id)
    {
        RecipientUserId = recipientUserId;
        Title = title;
        Body = body;
        Type = type;
        Deeplink = deeplink;
        Data = data;
        IsRead = false;
        CreatedAt = DateTime.UtcNow;
    }

    /// <summary>
    ///     ID của người nhận.
    /// </summary>
    public Guid RecipientUserId { get; private set; }

    /// <summary>
    ///     Tiêu đề thông báo.
    /// </summary>
    public string Title { get; private set; }

    /// <summary>
    ///     Nội dung thông báo.
    /// </summary>
    public string Body { get; private set; }

    /// <summary>
    ///     Thời gian tạo.
    /// </summary>
    public DateTime CreatedAt { get; private set; }

    /// <summary>
    ///     Trạng thái (đã đọc/chưa đọc).
    /// </summary>
    public bool IsRead { get; private set; }

    /// <summary>
    ///     Loại thông báo (InApp, Push, All).
    /// </summary>
    public NotificationType Type { get; private set; }

    /// <summary>
    ///     Deep link để điều hướng khi click vào notification.
    /// </summary>
    public string? Deeplink { get; private set; }

    /// <summary>
    ///     Dữ liệu đi kèm (nếu có).
    /// </summary>
    public string? Data { get; private set; } // Stored as JSON string

    public static Notification Create(
        Guid recipientUserId,
        string title,
        string body,
        NotificationType type,
        string? deeplink = null,
        Dictionary<string, string>? data = null)
    {
        var jsonData = data is not null
            ? JsonSerializer.Serialize(data)
            : null;

        return new Notification(Guid.NewGuid(), recipientUserId, title, body, type, deeplink, jsonData);
    }

    public void MarkAsRead()
    {
        IsRead = true;
    }
}