using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Device;

public record GetDevicesByUsersIntegrationQuery(List<Guid> UserIds)
    : IQuery<GetDevicesByUsersIntegrationResponse>;

public record GetDevicesByUsersIntegrationResponse(
    Dictionary<Guid, Guid> UserDeviceMap
);