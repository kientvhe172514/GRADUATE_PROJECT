using MediatR;
using Microsoft.Extensions.Logging;
using Zentry.Modules.DeviceManagement.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Device;
using Zentry.SharedKernel.Contracts.User;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.DeviceManagement.Features.AcceptDeviceChangeRequest;

public class HandleDeviceChangeRequestHandler(
    IDeviceRepository deviceRepository,
    ILogger<HandleDeviceChangeRequestHandler> logger,
    IMediator mediator,
    ISessionService sessionService)
    : ICommandHandler<HandleDeviceChangeRequestCommand, HandleDeviceChangeRequestResponse>
{
    public async Task<HandleDeviceChangeRequestResponse> Handle(HandleDeviceChangeRequestCommand command,
        CancellationToken cancellationToken)
    {
        var action = command.IsAccepted ? "Accepting" : "Rejecting";
        logger.LogInformation("Admin is {Action} device change request for UserRequestId: {UserRequestId}.",
            action, command.UserRequestId);

        var userRequestResponse = await mediator.Send(
            new UpdateUserRequestStatusIntegrationCommand(command.UserRequestId, command.IsAccepted),
            cancellationToken);

        var userId = userRequestResponse.UserId;
        var relatedDeviceId = userRequestResponse.RelatedEntityId;

        if (command.IsAccepted)
        {
            var currentActiveDevice = await deviceRepository.GetActiveDeviceForUserAsync(userId, cancellationToken);
            var deactivatedDeviceId = Guid.Empty;

            if (currentActiveDevice is not null)
            {
                currentActiveDevice.UpdateStatus(DeviceStatus.Inactive);
                await deviceRepository.UpdateAsync(currentActiveDevice, cancellationToken);
                deactivatedDeviceId = currentActiveDevice.Id;
                logger.LogInformation("Deactivated old device {DeviceId} for user {UserId}.", currentActiveDevice.Id,
                    userId);

                // ✅ Force logout user trên thiết bị cũ
                await sessionService.RevokeAllUserSessionsAsync(userId);
                logger.LogInformation("Force logged out user {UserId} from old device {DeviceId}.", userId,
                    currentActiveDevice.Id);
            }
            else
            {
                logger.LogWarning(
                    "No active device found for user {UserId}. Proceeding with new device activation.",
                    userId);
            }

            var newPendingDevice =
                await deviceRepository.GetPendingDeviceForUserAsync(userId, relatedDeviceId, cancellationToken);
            if (newPendingDevice is null)
            {
                logger.LogError(
                    "Acceptance failed: New pending device with ID {NewDeviceId} for user {UserId} not found or not in Pending status.",
                    relatedDeviceId, userId);
                throw new NotFoundException("NewDevice",
                    $"Thiết bị mới đang chờ duyệt với ID '{relatedDeviceId}' không tìm thấy hoặc không ở trạng thái chờ.");
            }

            newPendingDevice.UpdateStatus(DeviceStatus.Active);
            await deviceRepository.UpdateAsync(newPendingDevice, cancellationToken);
            logger.LogInformation("Activated new device {DeviceId} for user {UserId}.", newPendingDevice.Id, userId);

            logger.LogInformation("UserRequest {UserRequestId} approved successfully.", command.UserRequestId);

            return new HandleDeviceChangeRequestResponse
            {
                UpdatedDeviceId = newPendingDevice.Id,
                DeactivatedDeviceId = deactivatedDeviceId,
                UserRequestId = command.UserRequestId,
                Message = "Yêu cầu thay đổi thiết bị đã được chấp nhận thành công."
            };
        }

        var pendingDevice =
            await deviceRepository.GetPendingDeviceForUserAsync(userId, relatedDeviceId, cancellationToken);
        if (pendingDevice is not null)
        {
            pendingDevice.UpdateStatus(DeviceStatus.Rejected);
            await deviceRepository.UpdateAsync(pendingDevice, cancellationToken);
            logger.LogInformation("Rejected device {DeviceId} for user {UserId}.", pendingDevice.Id, userId);
        }

        logger.LogInformation("UserRequest {UserRequestId} rejected successfully.", command.UserRequestId);

        return new HandleDeviceChangeRequestResponse
        {
            UserRequestId = command.UserRequestId,
            Message = "Yêu cầu thay đổi thiết bị đã bị từ chối.",
            UpdatedDeviceId = relatedDeviceId,
            DeactivatedDeviceId = null
        };
    }
}