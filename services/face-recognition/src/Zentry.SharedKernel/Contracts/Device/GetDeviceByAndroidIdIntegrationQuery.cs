using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Device;

/// <summary>
///     Integration query để tìm device theo AndroidId
/// </summary>
public record GetDeviceByAndroidIdIntegrationQuery(string AndroidId)
    : IQuery<GetDeviceByAndroidIdIntegrationResponse>;

/// <summary>
///     Response chứa thông tin device
/// </summary>
public record GetDeviceByAndroidIdIntegrationResponse
{
    public DeviceInfo? Device { get; init; }
}