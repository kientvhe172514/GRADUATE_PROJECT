using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Device;

/// <summary>
///     Integration command để update FCM token cho device
/// </summary>
public record UpdateDeviceFcmTokenIntegrationCommand(
    Guid DeviceId,
    string FcmToken,
    string Platform,
    string? Model = null,
    string? Manufacturer = null,
    string? OsVersion = null,
    string? AppVersion = null
) : ICommand<UpdateDeviceFcmTokenIntegrationResponse>;

/// <summary>
///     Response khi update FCM token thành công
/// </summary>
public record UpdateDeviceFcmTokenIntegrationResponse
{
    public Guid DeviceId { get; init; }
    public string FcmToken { get; init; } = string.Empty;
    public DateTime UpdatedAt { get; init; }
    public string Message { get; init; } = string.Empty;
}