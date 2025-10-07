using Zentry.Modules.DeviceManagement.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Device;

namespace Zentry.Modules.DeviceManagement.Integration;

public class GetDevicesByAndroidIdListQueryHandler(IDeviceRepository repository)
    : IQueryHandler<GetDevicesByAndroidIdListIntegrationQuery, GetDevicesByAndroidIdListIntegrationResponse>
{
    public async Task<GetDevicesByAndroidIdListIntegrationResponse> Handle(
        GetDevicesByAndroidIdListIntegrationQuery request,
        CancellationToken cancellationToken)
    {
        if (request.AndroidIds.Count == 0)
            return new GetDevicesByAndroidIdListIntegrationResponse(new List<DeviceAndroidIdMapping>());

        var deviceMappings =
            await repository.GetDeviceAndUserIdsByAndroidIdsAsync(request.AndroidIds, cancellationToken);

        var result = deviceMappings.Select(mapping => new DeviceAndroidIdMapping(
            mapping.Value.DeviceId,
            mapping.Value.UserId,
            mapping.Key
        )).ToList();

        return new GetDevicesByAndroidIdListIntegrationResponse(result);
    }
}