using MediatR;
using Microsoft.Extensions.Logging;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Attendance;
using Zentry.SharedKernel.Contracts.User;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.AttendanceManagement.Application.Features.HandleAttendanceUpdateRequest;

public class HandleAttendanceUpdateRequestHandler(
    IAttendanceRecordRepository attendanceRepository,
    ILogger<HandleAttendanceUpdateRequestHandler> logger,
    IMediator mediator
) : ICommandHandler<HandleAttendanceUpdateRequestCommand, HandleAttendanceUpdateRequestResponse>
{
    public async Task<HandleAttendanceUpdateRequestResponse> Handle(
        HandleAttendanceUpdateRequestCommand command,
        CancellationToken cancellationToken)
    {
        var action = command.IsAccepted ? "Accepting" : "Rejecting";
        logger.LogInformation("Processing attendance update request {Action} for UserRequestId: {UserRequestId}.",
            action, command.UserRequestId);

        // Update UserRequest status and get related information - reusing existing integration command
        var userRequestResponse = await mediator.Send(
            new UpdateUserRequestStatusIntegrationCommand(command.UserRequestId, command.IsAccepted),
            cancellationToken);

        var studentId = userRequestResponse.UserId; // This is the student who requested the update
        var sessionId = userRequestResponse.RelatedEntityId; // This is the session ID

        if (command.IsAccepted)
        {
            // Find the attendance record for this student and session
            var attendanceRecord = await attendanceRepository.GetByUserIdAndSessionIdAsync(
                studentId, sessionId, cancellationToken);

            if (attendanceRecord is null)
            {
                logger.LogError("Attendance record not found for Student: {StudentId}, Session: {SessionId}",
                    studentId, sessionId);
                throw new NotFoundException("AttendanceRecord",
                    "Không tìm thấy bản ghi điểm danh cho sinh viên trong phiên học này.");
            }

            // Update attendance status from Absent to Present
            attendanceRecord.Update(AttendanceStatus.Present, true);
            await attendanceRepository.UpdateAsync(attendanceRecord, cancellationToken);
            await attendanceRepository.SaveChangesAsync(cancellationToken);

            logger.LogInformation(
                "Updated attendance record {AttendanceRecordId} for student {StudentId} in session {SessionId} from {OldStatus} to {NewStatus}.",
                attendanceRecord.Id, studentId, sessionId, "Absent", "Present");

            logger.LogInformation("UserRequest {UserRequestId} approved successfully.", command.UserRequestId);

            return new HandleAttendanceUpdateRequestResponse
            {
                AttendanceRecordId = attendanceRecord.Id,
                UserRequestId = command.UserRequestId,
                UpdatedStatus = AttendanceStatus.Present.ToString(),
                Message =
                    "Yêu cầu cập nhật trạng thái điểm danh đã được chấp nhận thành công. Trạng thái đã được cập nhật từ 'Vắng mặt' thành 'Có mặt'."
            };
        }

        // If rejected, just return the response (UserRequest status already updated by integration command)
        logger.LogInformation("UserRequest {UserRequestId} rejected successfully.", command.UserRequestId);

        return new HandleAttendanceUpdateRequestResponse
        {
            UserRequestId = command.UserRequestId,
            Message = "Yêu cầu cập nhật trạng thái điểm danh đã bị từ chối."
        };
    }
}