using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Attendance;

namespace Zentry.Modules.AttendanceManagement.Application.Integrations;

public class GetStudentWeeklyOverviewIntegrationQueryHandler(
    ISessionRepository sessionRepository,
    IAttendanceRecordRepository attendanceRecordRepository)
    : IQueryHandler<GetStudentWeeklyOverviewIntegrationQuery, GetStudentWeeklyOverviewIntegrationResponse>
{
    public async Task<GetStudentWeeklyOverviewIntegrationResponse> Handle(
        GetStudentWeeklyOverviewIntegrationQuery query,
        CancellationToken cancellationToken)
    {
        // 1. Lấy sessions trong tuần này cho các schedule đã cho
        var sessions = await sessionRepository.GetSessionsByScheduleIdsAndDateRangeAsync(
            query.ScheduleIds,
            query.StartOfWeekUtc,
            query.EndOfWeekUtc,
            cancellationToken);

        // 2. Lấy attendance records của sinh viên cho các sessions đó
        var sessionIds = sessions.Select(s => s.Id).ToList();
        var attendanceRecords = await attendanceRecordRepository.GetStudentAttendanceRecordsForSessionsAsync(
            query.StudentId,
            sessionIds,
            cancellationToken);

        // 3. Ánh xạ dữ liệu sang DTOs
        var sessionDtos = sessions.Select(s => new OverviewSessionDto
        {
            Id = s.Id,
            ScheduleId = s.ScheduleId,
            Status = s.Status.ToString().ToLower(),
            StartTime = s.StartTime,
            EndTime = s.EndTime
        }).ToList();

        var attendanceDtos = attendanceRecords.Select(ar => new OverviewAttendanceDto
        {
            SessionId = ar.SessionId,
            StudentId = ar.StudentId,
            Status = ar.Status.ToString().ToLower() // Chuyển enum sang chuỗi chữ thường
        }).ToList();

        // 4. Trả về response
        return new GetStudentWeeklyOverviewIntegrationResponse(sessionDtos, attendanceDtos);
    }
}