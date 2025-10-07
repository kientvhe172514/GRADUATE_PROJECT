using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Attendance;
using Zentry.SharedKernel.Contracts.Attendance;

namespace Zentry.Modules.AttendanceManagement.Application.Integrations;

public class GetAttendanceSummaryIntegrationQueryHandler(
    ISessionRepository sessionRepository,
    IAttendanceRecordRepository attendanceRecordRepository)
    : IQueryHandler<GetAttendanceSummaryIntegrationQuery, AttendanceSummaryIntegrationResponse>
{
    public async Task<AttendanceSummaryIntegrationResponse> Handle(
        GetAttendanceSummaryIntegrationQuery query,
        CancellationToken cancellationToken)
    {
        var session =
            await sessionRepository.GetSessionByScheduleIdAndDate(query.ScheduleId, query.Date, cancellationToken);

        if (session is null) return new AttendanceSummaryIntegrationResponse();

        var attendanceRecords =
            await attendanceRecordRepository.GetAttendanceRecordsBySessionIdAsync(session.Id, cancellationToken);

        var presentCount = attendanceRecords.Count(r => Equals(r.Status, AttendanceStatus.Present));
        var absentCount = attendanceRecords.Count(r => Equals(r.Status, AttendanceStatus.Absent));

        return new AttendanceSummaryIntegrationResponse
        {
            PresentCount = presentCount,
            AbsentCount = absentCount,
            AttendedCount = presentCount,
            TotalStudentsFromSession = 0
        };
    }
}