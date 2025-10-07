using MediatR;
using Microsoft.Extensions.Logging;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Attendance;
using Zentry.SharedKernel.Contracts.User;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.AttendanceManagement.Application.Features.RequestAttendanceUpdate;

public class RequestAttendanceUpdateHandler(
    ISessionRepository sessionRepository,
    IMediator mediator,
    ILogger<RequestAttendanceUpdateHandler> logger
) : ICommandHandler<RequestAttendanceUpdateCommand, RequestAttendanceUpdateResponse>
{
    public async Task<RequestAttendanceUpdateResponse> Handle(
        RequestAttendanceUpdateCommand command,
        CancellationToken cancellationToken)
    {
        logger.LogInformation("Processing attendance update request for Student: {StudentId}, Session: {SessionId}",
            command.StudentId, command.SessionId);

        // Validate session exists
        var session = await sessionRepository.GetByIdAsync(command.SessionId, cancellationToken);
        if (session is null)
        {
            logger.LogWarning("Session with ID {SessionId} not found.", command.SessionId);
            throw new NotFoundException("Session",
                $"Phiên điểm danh với ID '{command.SessionId}' không tìm thấy.");
        }

        // Get lecturer ID from session
        var lecturerId = session.LecturerId;

        // Check if session has ended
        if (session.EndTime > DateTime.UtcNow)
        {
            logger.LogWarning("Cannot request attendance update for ongoing session {SessionId}", command.SessionId);
            throw new BusinessRuleException("SESSION_NOT_ENDED",
                "Không thể yêu cầu cập nhật điểm danh cho phiên học chưa kết thúc.");
        }

        // Create user request
        var createUserRequestCommand = new CreateUserRequestIntegrationCommand(
            command.StudentId,
            lecturerId,
            RequestType.ClaimAttendance,
            session.Id,
            command.Reason
        );

        var userRequestResponse = await mediator.Send(createUserRequestCommand, cancellationToken);

        logger.LogInformation("Attendance update request created successfully. UserRequestId: {UserRequestId}",
            userRequestResponse.UserRequestId);

        return new RequestAttendanceUpdateResponse
        {
            UserRequestId = userRequestResponse.UserRequestId,
            Message = "Yêu cầu cập nhật trạng thái điểm danh đã được gửi thành công đến giảng viên."
        };
    }
}