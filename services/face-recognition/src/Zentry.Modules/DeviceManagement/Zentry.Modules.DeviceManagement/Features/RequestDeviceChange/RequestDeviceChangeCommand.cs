using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.DeviceManagement.Features.RequestDeviceChange;

public class RequestDeviceChangeCommand : ICommand<RequestDeviceChangeResponse>
{
    public Guid UserId { get; set; }
    public string Reason { get; set; } = string.Empty;

    public string DeviceName { get; set; } = string.Empty;
    public string AndroidId { get; set; } = string.Empty;
    public string? Platform { get; set; }
    public string? OsVersion { get; set; }
    public string? Model { get; set; }
    public string? Manufacturer { get; set; }
    public string? AppVersion { get; set; }
    public string? PushNotificationToken { get; set; }
}

public class RequestDeviceChangeResponse
{
    public Guid NewDeviceId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}