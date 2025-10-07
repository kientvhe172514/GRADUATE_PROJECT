using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Device;

public record GetUserIdsByDevicesIntegrationQuery(List<Guid> DeviceIds)
    : IQuery<GetUserIdsByDevicesIntegrationResponse>;

public record GetUserIdsByDevicesIntegrationResponse(
    Dictionary<Guid, Guid> UserDeviceMap
);