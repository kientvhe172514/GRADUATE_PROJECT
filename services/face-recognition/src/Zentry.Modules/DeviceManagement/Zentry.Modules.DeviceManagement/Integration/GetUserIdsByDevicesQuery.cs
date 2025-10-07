using Microsoft.Extensions.Logging;
using Zentry.Modules.DeviceManagement.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Device;

namespace Zentry.Modules.DeviceManagement.Integration;

public class GetUserIdsByDevicesQueryHandler(
    IDeviceRepository repository,
    ILogger<GetUserIdsByDevicesQueryHandler> logger) // Thêm logger
    : IQueryHandler<GetUserIdsByDevicesIntegrationQuery, GetUserIdsByDevicesIntegrationResponse>
{
    public async Task<GetUserIdsByDevicesIntegrationResponse> Handle(
        GetUserIdsByDevicesIntegrationQuery request,
        CancellationToken cancellationToken)
    {
        logger.LogInformation("Handling GetUserIdsByDevicesIntegrationQuery for {Count} device IDs.",
            request.DeviceIds.Count);

        if (request.DeviceIds.Count == 0)
        {
            logger.LogWarning("Request contains no device IDs. Returning empty map.");
            return new GetUserIdsByDevicesIntegrationResponse(new Dictionary<Guid, Guid>());
        }

        // Sử dụng phương thức GetUserIdsByDeviceIdsAsync đã hoàn thiện
        var activeDevices = await repository.GetUserIdsByDeviceIdsAsync(request.DeviceIds, cancellationToken);

        // Tạo Dictionary<Guid DeviceId, Guid UserId>
        // Lưu ý: Dữ liệu bạn cung cấp cho thấy activeDevices là List<Device>.
        // Từ đó, chúng ta cần ánh xạ Device.Id (là DeviceId) sang Device.UserId.
        // Đảm bảo không có DeviceId trùng lặp nếu có nhiều UserId cho cùng 1 DeviceId (không nên xảy ra)
        var userDeviceMap = activeDevices
            .ToDictionary(d => d.Id, d => d.UserId); // Key là DeviceId, Value là UserId

        logger.LogInformation("Found {FoundCount} active devices for {RequestedCount} requested device IDs.",
            userDeviceMap.Count, request.DeviceIds.Count);

        return new GetUserIdsByDevicesIntegrationResponse(userDeviceMap);
    }
}