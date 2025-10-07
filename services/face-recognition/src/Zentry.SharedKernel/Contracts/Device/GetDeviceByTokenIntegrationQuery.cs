using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Device;

/// <summary>
///     Query để lấy device info từ device token
/// </summary>
public class GetDeviceByTokenIntegrationQuery : IQuery<GetDeviceByTokenIntegrationResponse>
{
    public GetDeviceByTokenIntegrationQuery(string deviceToken)
    {
        DeviceToken = deviceToken;
    }

    public string DeviceToken { get; }
}

public class GetDeviceByTokenIntegrationResponse
{
    public DeviceInfo? Device { get; set; }
}

public class DeviceInfo
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? LastVerifiedAt { get; set; }
}