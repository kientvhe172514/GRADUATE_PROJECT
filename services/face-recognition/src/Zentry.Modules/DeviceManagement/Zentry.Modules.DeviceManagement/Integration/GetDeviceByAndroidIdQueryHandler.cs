using Zentry.Modules.DeviceManagement.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Device;

namespace Zentry.Modules.DeviceManagement.Integration;

public class GetDeviceByAndroidIdQueryHandler(IDeviceRepository repository)
    : IQueryHandler<GetDeviceByAndroidIdIntegrationQuery, GetDeviceByAndroidIdIntegrationResponse>
{
    public async Task<GetDeviceByAndroidIdIntegrationResponse> Handle(GetDeviceByAndroidIdIntegrationQuery request,
        CancellationToken cancellationToken)
    {
        var device = await repository.GetByAndroidIdAsync(request.AndroidId, cancellationToken);

        if (device != null && device.Status.ToString() == "Active")
            return new GetDeviceByAndroidIdIntegrationResponse
            {
                Device = new DeviceInfo
                {
                    Id = device.Id,
                    UserId = device.UserId,
                    Status = device.Status.ToString(),
                    CreatedAt = device.CreatedAt,
                    LastVerifiedAt = device.LastVerifiedAt
                }
            };

        return new GetDeviceByAndroidIdIntegrationResponse { Device = null };
    }
}