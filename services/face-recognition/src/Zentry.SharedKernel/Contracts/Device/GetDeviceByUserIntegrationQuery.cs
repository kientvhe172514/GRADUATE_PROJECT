using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Device;

public record GetDeviceByUserIntegrationQuery(Guid UserId)
    : IQuery<GetDeviceByUserIntegrationResponse>;

public record GetDeviceByUserIntegrationResponse(
    Guid DeviceId,
    Guid UserId
);