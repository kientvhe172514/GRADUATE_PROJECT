using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.User;

public record GetUserRolesByDevicesIntegrationQuery(List<Guid> DeviceIds)
    : IQuery<GetUserRolesByDevicesIntegrationResponse>;

public record GetUserRolesByDevicesIntegrationResponse(
    Dictionary<Guid, string> DeviceRolesMap
);