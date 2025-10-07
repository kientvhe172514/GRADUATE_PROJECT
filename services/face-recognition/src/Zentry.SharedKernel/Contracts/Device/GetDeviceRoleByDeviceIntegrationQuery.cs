using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Device;

public record GetDeviceRoleByDeviceIntegrationQuery(Guid DeviceId) : IQuery<GetDeviceRoleByDeviceIntegrationResponse>;

public record GetDeviceRoleByDeviceIntegrationResponse(
    Guid DeviceId,
    string Role
);