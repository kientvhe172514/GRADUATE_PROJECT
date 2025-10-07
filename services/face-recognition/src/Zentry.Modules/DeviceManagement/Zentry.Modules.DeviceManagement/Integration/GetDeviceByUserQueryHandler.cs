using Zentry.Modules.DeviceManagement.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Device;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.DeviceManagement.Integration;

public class GetDeviceByUserQueryHandler(IDeviceRepository repository)
    : IQueryHandler<GetDeviceByUserIntegrationQuery, GetDeviceByUserIntegrationResponse>
{
    public async Task<GetDeviceByUserIntegrationResponse> Handle(GetDeviceByUserIntegrationQuery request,
        CancellationToken cancellationToken)
    {
        var deviceId = await repository.GetActiveDeviceByUserIdAsync(request.UserId, cancellationToken);

        if (deviceId.HasValue)
            return new GetDeviceByUserIntegrationResponse(deviceId.Value, request.UserId);

        throw new NotFoundException(nameof(GetDeviceByUserQueryHandler),
            "Active Device not found for this user.");
    }
}