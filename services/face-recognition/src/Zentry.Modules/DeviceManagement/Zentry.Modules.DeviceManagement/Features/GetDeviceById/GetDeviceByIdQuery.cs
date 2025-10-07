using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.DeviceManagement.Features.GetDeviceById;

public record GetDeviceByIdQuery(Guid DeviceId) : IQuery<GetDeviceDetailsResponse>;

public class GetDeviceDetailsResponse
{
    public Guid DeviceId { get; set; }
    public Guid UserId { get; set; }
    public string? UserFullName { get; set; }
    public string? UserEmail { get; set; }
    public string DeviceName { get; set; } = string.Empty;
    public string AndroidId { get; set; } = string.Empty;
    public string? DeviceToken { get; set; } = string.Empty;
    public string? Platform { get; set; }
    public string? OsVersion { get; set; }
    public string? Model { get; set; }
    public string? Manufacturer { get; set; }
    public string? AppVersion { get; set; }
    public string? PushNotificationToken { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? LastVerifiedAt { get; set; }
    public string Status { get; set; }
}