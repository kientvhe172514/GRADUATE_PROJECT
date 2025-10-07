using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Attendance;

namespace Zentry.Modules.AttendanceManagement.Application.Integrations;

public class GetAttendanceDataByScheduleIdsIntegrationQueryHandler(
    IAttendanceRecordRepository attendanceRecordRepository,
    ISessionRepository sessionRepository
) : IQueryHandler<GetAttendanceDataByScheduleIdsIntegrationQuery,
    List<GetAttendanceDataByScheduleIdsIntegrationResponse>>
{
    public async Task<List<GetAttendanceDataByScheduleIdsIntegrationResponse>> Handle(
        GetAttendanceDataByScheduleIdsIntegrationQuery request,
        CancellationToken cancellationToken)
    {
        // 1. Lấy tất cả các session liên quan đến danh sách scheduleId
        var sessions = await sessionRepository.GetSessionsByScheduleIdsAsync(request.ScheduleIds, cancellationToken);
        var sessionIds = sessions.Select(s => s.Id).ToList();

        // 2. Lấy tất cả các bản ghi điểm danh liên quan đến danh sách sessionIds
        var attendanceRecords =
            await attendanceRecordRepository.GetAttendanceRecordsBySessionIdsAsync(sessionIds, cancellationToken);

        // 3. Nhóm các bản ghi điểm danh theo SessionId
        var attendanceRecordsBySessionId = attendanceRecords
            .GroupBy(ar => ar.SessionId)
            .ToDictionary(
                group => group.Key,
                group => group.Select(ar =>
                    new OverviewAttendanceDto
                    {
                        SessionId = ar.SessionId,
                        StudentId = ar.StudentId,
                        Status = ar.Status.ToString()
                    }).ToList()
            );

        // 4. Tạo response cho mỗi ScheduleId
        var response = new List<GetAttendanceDataByScheduleIdsIntegrationResponse>();

        foreach (var scheduleId in request.ScheduleIds)
        {
            var scheduleSessions = sessions.Where(s => s.ScheduleId == scheduleId).ToList();

            var scheduleAttendanceRecords = new List<OverviewAttendanceDto>();
            foreach (var session in scheduleSessions)
                if (attendanceRecordsBySessionId.TryGetValue(session.Id, out var records))
                    scheduleAttendanceRecords.AddRange(records);

            response.Add(new GetAttendanceDataByScheduleIdsIntegrationResponse
            {
                ScheduleId = scheduleId,
                AttendanceRecords = scheduleAttendanceRecords
            });
        }

        return response;
    }
}