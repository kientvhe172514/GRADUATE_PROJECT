using Zentry.Modules.DeviceManagement.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Device;

namespace Zentry.Modules.DeviceManagement.Features.GetTotalDevices;

public class GetTotalDevicesQueryHandler(
    IDeviceRepository deviceRepository
) : IQueryHandler<GetTotalDevicesQuery, GetTotalDevicesResponse>
{
    public async Task<GetTotalDevicesResponse> Handle(GetTotalDevicesQuery request, CancellationToken cancellationToken)
    {
        var totalCount = await deviceRepository.CountAllAsync(cancellationToken);
        var activeCount = await deviceRepository.CountByStatusAsync(DeviceStatus.Active, cancellationToken);

        return new GetTotalDevicesResponse(activeCount, totalCount);
    }
}