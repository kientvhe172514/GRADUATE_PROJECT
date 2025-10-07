using Zentry.Modules.DeviceManagement.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Device;

namespace Zentry.Modules.DeviceManagement.Integration;

public class GetDeviceByTokenQueryHandler(IDeviceRepository repository)
    : IQueryHandler<GetDeviceByTokenIntegrationQuery, GetDeviceByTokenIntegrationResponse>
{
    public async Task<GetDeviceByTokenIntegrationResponse> Handle(
        GetDeviceByTokenIntegrationQuery request,
        CancellationToken cancellationToken)
    {
        var device = await repository.GetByDeviceTokenAsync(request.DeviceToken, cancellationToken);

        if (device == null) return new GetDeviceByTokenIntegrationResponse { Device = null };

        var deviceInfo = new DeviceInfo
        {
            Id = device.Id,
            UserId = device.UserId,
            Status = device.Status.ToString(),
            CreatedAt = device.CreatedAt,
            LastVerifiedAt = device.LastVerifiedAt
        };

        return new GetDeviceByTokenIntegrationResponse { Device = deviceInfo };
    }
}