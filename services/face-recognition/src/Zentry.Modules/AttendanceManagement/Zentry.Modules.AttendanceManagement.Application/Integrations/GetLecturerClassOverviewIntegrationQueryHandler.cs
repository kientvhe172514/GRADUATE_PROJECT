// Zentry.Modules.AttendanceManagement.Application.Integrations/GetLecturerClassOverviewIntegrationQueryHandler.cs

// Loại bỏ IClassSectionRepository khỏi constructor

using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Attendance;

namespace Zentry.Modules.AttendanceManagement.Application.Integrations;

public class GetLecturerClassOverviewIntegrationQueryHandler(
    ISessionRepository sessionRepository,
    IAttendanceRecordRepository attendanceRepository
) : IQueryHandler<GetLecturerClassOverviewIntegrationQuery, GetLecturerClassOverviewIntegrationResponse>
{
    public async Task<GetLecturerClassOverviewIntegrationResponse> Handle(
        GetLecturerClassOverviewIntegrationQuery query,
        CancellationToken cancellationToken)
    {
        // Lấy tất cả sessions cho các scheduleIds đã cho
        var sessions = await sessionRepository.GetSessionsByScheduleIdsAsync(query.ScheduleIds, cancellationToken);

        // Lấy tất cả attendance records cho các sessions này
        var sessionIds = sessions.Select(s => s.Id).ToList();
        var attendanceRecords =
            await attendanceRepository.GetAttendanceRecordsBySessionIdsAsync(sessionIds, cancellationToken);

        // Ánh xạ dữ liệu sang DTOs
        var sessionDtos = sessions.Select(s => new OverviewSessionDto
        {
            Id = s.Id,
            ScheduleId = s.ScheduleId,
            Status = s.Status.ToString().ToLower(),
            StartTime = s.StartTime,
            EndTime = s.EndTime
        }).ToList();

        var attendanceDtos = attendanceRecords.Select(a => new OverviewAttendanceDto
        {
            SessionId = a.SessionId,
            StudentId = a.StudentId,
            Status = a.Status.ToString() // Giữ nguyên Enum String
        }).ToList();

        return new GetLecturerClassOverviewIntegrationResponse(sessionDtos, attendanceDtos);
    }
}