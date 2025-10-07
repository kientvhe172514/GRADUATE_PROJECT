using MediatR;
using Microsoft.Extensions.Logging;
using Zentry.Modules.DeviceManagement.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Device;
using Zentry.SharedKernel.Contracts.User;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.DeviceManagement.Integration;

public class GetDeviceRoleByDeviceQueryHandler(
    IDeviceRepository deviceRepository,
    IMediator mediator,
    ILogger<GetDeviceRoleByDeviceQueryHandler> logger)
    : IQueryHandler<GetDeviceRoleByDeviceIntegrationQuery, GetDeviceRoleByDeviceIntegrationResponse>
{
    public async Task<GetDeviceRoleByDeviceIntegrationResponse> Handle(GetDeviceRoleByDeviceIntegrationQuery request,
        CancellationToken cancellationToken)
    {
        logger.LogInformation("Attempting to get role for DeviceId: {DeviceId}", request.DeviceId);

        // 1. Lấy thông tin thiết bị để có UserId
        var device = await deviceRepository.GetByIdAsync(request.DeviceId, cancellationToken);
        if (device is null)
        {
            logger.LogWarning("Device {DeviceId} not found when getting role.", request.DeviceId);
            throw new NotFoundException(nameof(GetDeviceRoleByDeviceQueryHandler),
                $"Device with ID {request.DeviceId} not found.");
        }

        // 2. Lấy vai trò của người dùng từ module UserManagement
        var getUserRoleQuery = new GetUserRoleIntegrationQuery(device.UserId);
        try
        {
            var userRoleResponse = await mediator.Send(getUserRoleQuery, cancellationToken);
            logger.LogInformation("Device {DeviceId} belongs to user {UserId} with role {Role}.",
                request.DeviceId, device.UserId, userRoleResponse.Role);

            return new GetDeviceRoleByDeviceIntegrationResponse(device.Id, userRoleResponse.Role);
        }
        catch (NotFoundException ex)
        {
            logger.LogWarning(ex,
                "User {UserId} associated with Device {DeviceId} not found when getting role. Returning 'Unknown'.",
                device.UserId, request.DeviceId);
            throw new NotFoundException(nameof(GetDeviceRoleByDeviceQueryHandler),
                $"Device with ID {request.DeviceId} not found.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Error getting role for user {UserId} associated with Device {DeviceId}. Returning 'Error'.",
                device.UserId, request.DeviceId);
            throw new Exception(ex.Message);
        }
    }
}