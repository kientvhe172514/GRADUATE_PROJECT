using MediatR;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Attendance;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.AttendanceManagement.Application.Features.UpdateStudentAttendanceStatus;

public class UpdateStudentAttendanceStatusCommandHandler(
    IAttendanceRecordRepository attendanceRecordRepository
) : ICommandHandler<UpdateStudentAttendanceStatusCommand, Unit>
{
    public async Task<Unit> Handle(UpdateStudentAttendanceStatusCommand request, CancellationToken cancellationToken)
    {
        var attendanceRecord = await attendanceRecordRepository.GetByUserIdAndSessionIdAsync(
            request.UserId,
            request.SessionId,
            cancellationToken
        );

        if (attendanceRecord is null)
            throw new NotFoundException(
                $"AttendanceRecord for UserId '{request.UserId}' and SessionId '{request.SessionId}' not found.");

        if (!(Equals(attendanceRecord.Status, AttendanceStatus.Absent) ||
              Equals(attendanceRecord.Status, AttendanceStatus.Present)))
            throw new BusinessRuleException(
                "INVALID_STATUS_UPDATE",
                $"Chỉ có thể cập nhật trạng thái điểm danh từ 'Absent' hoặc 'Present'  . Trạng thái hiện tại: '{attendanceRecord.Status}''."
            );


        if (Equals(attendanceRecord.Status, AttendanceStatus.Absent))
        {
            const double newPercentageAttended = 100.0;

            attendanceRecord.Update(
                AttendanceStatus.Present,
                true,
                percentageAttended: newPercentageAttended
            );
        }
        else
        {
            const double newPercentageAttended = 0;

            attendanceRecord.Update(
                AttendanceStatus.Absent,
                true,
                percentageAttended: newPercentageAttended
            );
        }

        await attendanceRecordRepository.UpdateAsync(attendanceRecord, cancellationToken);
        await attendanceRecordRepository.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}