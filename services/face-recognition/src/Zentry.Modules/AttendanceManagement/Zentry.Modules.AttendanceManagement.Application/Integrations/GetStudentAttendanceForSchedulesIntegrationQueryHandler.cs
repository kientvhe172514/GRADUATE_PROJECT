using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Attendance;
using Zentry.SharedKernel.Contracts.Attendance;

namespace Zentry.Modules.AttendanceManagement.Application.Integrations;

public class GetStudentAttendanceForSchedulesIntegrationQueryHandler(
    ISessionRepository sessionRepository,
    IAttendanceRecordRepository attendanceRecordRepository)
    : IQueryHandler<GetStudentAttendanceForSchedulesIntegrationQuery,
        GetStudentAttendanceForSchedulesIntegrationResponse>
{
    public async Task<GetStudentAttendanceForSchedulesIntegrationResponse> Handle(
        GetStudentAttendanceForSchedulesIntegrationQuery request,
        CancellationToken cancellationToken)
    {
        var sessions = await sessionRepository.GetSessionsByScheduleIdsAsync(request.ScheduleIds, cancellationToken);
        var sessionIds = sessions.Select(s => s.Id).ToList();

        var attendanceRecords = await attendanceRecordRepository.GetAttendanceRecordsByStudentIdAndSessionIdsAsync(
            request.StudentId, sessionIds, cancellationToken);

        var sessionToScheduleMap = sessions.ToDictionary(s => s.Id, s => s.ScheduleId);

        var attendanceData = new Dictionary<Guid, string>();

        foreach (var record in attendanceRecords)
            if (sessionToScheduleMap.TryGetValue(record.SessionId, out var scheduleId))
                attendanceData[scheduleId] = record.Status.ToString();

        // Tạo danh sách DTO response
        var result = request.ScheduleIds.Select(scheduleId => new StudentAttendanceForScheduleDto
        {
            ScheduleId = scheduleId,
            Status = attendanceData.GetValueOrDefault(scheduleId, AttendanceStatus.Absent.ToString())
        }).ToList();

        return new GetStudentAttendanceForSchedulesIntegrationResponse(result);
    }
}