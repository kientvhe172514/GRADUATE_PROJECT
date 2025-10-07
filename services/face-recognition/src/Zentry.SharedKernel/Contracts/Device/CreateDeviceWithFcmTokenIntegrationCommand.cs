using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Device;

/// <summary>
///     Integration command để tạo device mới với FCM token
/// </summary>
public record CreateDeviceWithFcmTokenIntegrationCommand(
    Guid UserId,
    string AndroidId,
    string FcmToken,
    string Platform,
    string DeviceName,
    string? Model = null,
    string? Manufacturer = null,
    string? OsVersion = null,
    string? AppVersion = null
) : ICommand<CreateDeviceWithFcmTokenIntegrationResponse>;

/// <summary>
///     Response khi tạo device mới thành công
/// </summary>
public record CreateDeviceWithFcmTokenIntegrationResponse
{
    public Guid DeviceId { get; init; }
    public Guid UserId { get; init; }
    public string AndroidId { get; init; } = string.Empty;
    public string FcmToken { get; init; } = string.Empty;
    public string Platform { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public string Message { get; init; } = string.Empty;
}