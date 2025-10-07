using MediatR;
using Microsoft.Extensions.Logging;
using Zentry.Modules.DeviceManagement.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.User;

namespace Zentry.Modules.DeviceManagement.Integration;

public class GetUserRolesByDevicesQueryHandler(
    IDeviceRepository deviceRepository,
    IMediator mediator,
    ILogger<GetUserRolesByDevicesQueryHandler> logger)
    : IQueryHandler<GetUserRolesByDevicesIntegrationQuery, GetUserRolesByDevicesIntegrationResponse>
{
    public async Task<GetUserRolesByDevicesIntegrationResponse> Handle(
        GetUserRolesByDevicesIntegrationQuery request,
        CancellationToken cancellationToken)
    {
        logger.LogInformation("Attempting to get roles for {Count} DeviceIds in batch.", request.DeviceIds.Count);

        // 1. Lấy thông tin thiết bị (UserId) cho tất cả các DeviceId được yêu cầu
        var devices =
            await deviceRepository.GetByIdsAsync(request.DeviceIds,
                cancellationToken); // Cần phương thức GetByIdsAsync trong IDeviceRepository

        if (!devices.Any())
        {
            logger.LogWarning("No devices found for the provided DeviceIds. Returning empty map.");
            return new GetUserRolesByDevicesIntegrationResponse(new Dictionary<Guid, string>());
        }

        // Tạo map DeviceId -> UserId
        var deviceToUserMap = devices.ToDictionary(d => d.Id, d => d.UserId);
        var uniqueUserIds = devices.Select(d => d.UserId).Distinct().ToList();

        // 2. Lấy vai trò của tất cả người dùng liên quan từ module UserManagement (bằng query batch mới)
        var userRolesMap = new Dictionary<Guid, string>();
        if (uniqueUserIds.Count != 0)
        {
            var getUserRolesQuery = new GetUserRolesIntegrationQuery(uniqueUserIds);
            try
            {
                var userRolesResponse = await mediator.Send(getUserRolesQuery, cancellationToken);
                userRolesMap = userRolesResponse.UserRolesMap;
                logger.LogInformation("Fetched roles for {Count} unique UserIds.", userRolesMap.Count);
            }
            catch (Exception ex)
            {
                logger.LogError(ex,
                    "Error getting roles for users associated with devices. Some roles might be 'Unknown'.");
                // Tùy chọn: Xử lý lỗi, ví dụ log và tiếp tục với vai trò mặc định "Unknown"
            }
        }

        // 3. Kết hợp thông tin DeviceId -> UserId và UserId -> Role để tạo DeviceId -> Role
        var deviceRolesMap = new Dictionary<Guid, string>();
        foreach (var device in devices)
            if (userRolesMap.TryGetValue(device.UserId, out var role))
            {
                deviceRolesMap[device.Id] = role;
            }
            else
            {
                deviceRolesMap[device.Id] = "Unknown";
                logger.LogWarning(
                    "Role not found for user {UserId} associated with device {DeviceId}. Defaulting to 'Unknown'.",
                    device.UserId, device.Id);
            }

        logger.LogInformation("Successfully retrieved roles for {Count} DeviceIds.", deviceRolesMap.Count);
        return new GetUserRolesByDevicesIntegrationResponse(deviceRolesMap);
    }
}