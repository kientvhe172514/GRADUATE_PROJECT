using Zentry.Modules.DeviceManagement.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Device;

namespace Zentry.Modules.DeviceManagement.Integration;

public class GetDevicesByUsersQueryHandler(IDeviceRepository repository)
    : IQueryHandler<GetDevicesByUsersIntegrationQuery, GetDevicesByUsersIntegrationResponse>
{
    public async Task<GetDevicesByUsersIntegrationResponse> Handle(GetDevicesByUsersIntegrationQuery request,
        CancellationToken cancellationToken)
    {
        var activeDevices = await repository.GetActiveDevicesByUserIdsAsync(request.UserIds, cancellationToken);

        var userDeviceMap = activeDevices
            .ToDictionary(d => d.UserId, d => d.Id);

        return new GetDevicesByUsersIntegrationResponse(userDeviceMap);
    }
}