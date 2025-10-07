namespace Zentry.Modules.DeviceManagement.Dtos;

public class DeviceListItemDto
{
    public Guid DeviceId { get; set; }
    public Guid UserId { get; set; }
    public string? UserFullName { get; set; }
    public string? UserEmail { get; set; }
    public string DeviceName { get; set; } = string.Empty;
    public string AndroidId { get; set; } = string.Empty;
    public string? Platform { get; set; }
    public string? OsVersion { get; set; }
    public string? Model { get; set; }
    public string? Manufacturer { get; set; }
    public string? AppVersion { get; set; }
    public string? PushNotificationToken { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? LastVerifiedAt { get; set; }
    public required string Status { get; set; }
}