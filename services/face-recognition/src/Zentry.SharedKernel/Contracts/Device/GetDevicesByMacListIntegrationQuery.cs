using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Device;

public record GetDevicesByAndroidIdListIntegrationQuery(List<string> AndroidIds)
    : IQuery<GetDevicesByAndroidIdListIntegrationResponse>;

public record GetDevicesByAndroidIdListIntegrationResponse(
    List<DeviceAndroidIdMapping> DeviceMappings
);

public record DeviceAndroidIdMapping(
    Guid DeviceId,
    Guid UserId,
    string AndroidId
);