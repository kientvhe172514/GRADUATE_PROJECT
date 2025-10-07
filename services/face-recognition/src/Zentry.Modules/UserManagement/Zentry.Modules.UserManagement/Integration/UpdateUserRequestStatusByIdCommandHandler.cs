using Microsoft.Extensions.Logging;
using Zentry.Modules.UserManagement.Interfaces;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Attendance;
using Zentry.SharedKernel.Contracts.User;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.UserManagement.Integration;

public class UpdateUserRequestStatusByIdCommandHandler(
    IUserRequestRepository userRequestRepository,
    ILogger<UpdateUserRequestStatusByIdCommandHandler> logger)
    : ICommandHandler<UpdateUserRequestStatusIntegrationCommand,
        UpdateUserRequestStatusIntegrationResponse>
{
    public async Task<UpdateUserRequestStatusIntegrationResponse> Handle(
        UpdateUserRequestStatusIntegrationCommand command,
        CancellationToken cancellationToken)
    {
        var userRequest = await userRequestRepository.GetByIdAsync(command.UserRequestId, cancellationToken);
        if (userRequest is null)
        {
            logger.LogWarning("UserRequest with ID {UserRequestId} not found.", command.UserRequestId);
            throw new NotFoundException("UserRequest",
                $"Yêu cầu người dùng với ID '{command.UserRequestId}' không tìm thấy.");
        }

        // Support both UpdateDevice and UpdateAttendance request types
        if (!userRequest.RequestType.Equals(RequestType.UpdateDevice) &&
            !userRequest.RequestType.Equals(RequestType.ClaimAttendance))
            throw new BusinessRuleException("INVALID_REQUEST_TYPE",
                $"Loại yêu cầu không hợp lệ. Chỉ chấp nhận yêu cầu '{RequestType.UpdateDevice}' hoặc '{RequestType.ClaimAttendance}'.");

        if (!userRequest.Status.Equals(RequestStatus.Pending))
            throw new BusinessRuleException("INVALID_REQUEST_STATUS",
                $"Yêu cầu người dùng với ID '{command.UserRequestId}' không ở trạng thái chờ duyệt.");

        if (command.IsAccepted)
            userRequest.Approve();
        else
            userRequest.Reject();

        await userRequestRepository.UpdateAsync(userRequest, cancellationToken);
        await userRequestRepository.SaveChangesAsync(cancellationToken);

        logger.LogInformation("UserRequest {UserRequestId} of type {RequestType} status updated to {Status}",
            command.UserRequestId, userRequest.RequestType.ToString(), command.IsAccepted ? "Approved" : "Rejected");

        return new UpdateUserRequestStatusIntegrationResponse(userRequest.RequestedByUserId,
            userRequest.RelatedEntityId);
    }
}