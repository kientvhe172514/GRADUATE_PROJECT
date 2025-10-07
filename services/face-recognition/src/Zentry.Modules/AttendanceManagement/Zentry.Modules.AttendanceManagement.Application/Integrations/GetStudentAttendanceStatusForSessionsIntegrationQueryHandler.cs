using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Attendance;

namespace Zentry.Modules.AttendanceManagement.Application.Integrations;

public class GetStudentAttendanceStatusForSessionsIntegrationQueryHandler(
    IAttendanceRecordRepository attendanceRecordRepository)
    : IQueryHandler<GetStudentAttendanceStatusForSessionsIntegrationQuery,
        GetStudentAttendanceStatusForSessionsIntegrationResponse>
{
    public async Task<GetStudentAttendanceStatusForSessionsIntegrationResponse> Handle(
        GetStudentAttendanceStatusForSessionsIntegrationQuery query,
        CancellationToken cancellationToken)
    {
        var attendanceRecords = await attendanceRecordRepository.GetStudentAttendanceRecordsForSessionsAsync(
            query.StudentId,
            query.SessionIds,
            cancellationToken);

        var dtos = attendanceRecords.Select(ar => new StudentAttendanceStatusDto
        {
            SessionId = ar.SessionId,
            Status = ar.Status.ToString().ToLower()
        }).ToList();

        return new GetStudentAttendanceStatusForSessionsIntegrationResponse(dtos);
    }
}