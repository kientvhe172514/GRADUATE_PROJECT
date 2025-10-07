using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Attendance;
using Zentry.SharedKernel.Extensions;

namespace Zentry.Modules.AttendanceManagement.Application.Integrations;

public class GetSessionsByScheduleIdsIntegrationHandler(ISessionRepository sessionRepository)
    : IQueryHandler<GetSessionsByScheduleIdsIntegrationQuery, GetSessionsByScheduleIdsIntegrationResponse>
{
    public async Task<GetSessionsByScheduleIdsIntegrationResponse> Handle(
        GetSessionsByScheduleIdsIntegrationQuery request,
        CancellationToken cancellationToken)
    {
        var sessions = await sessionRepository.GetSessionsWithAttendanceRecordsByScheduleIdsAsync(
            request.ScheduleIds,
            cancellationToken);

        var responseData = sessions
            .OrderBy(s => s.StartTime)
            .Select(s =>
            {
                var localStartTime = s.StartTime.ToVietnamLocalTime();
                var localEndTime = s.EndTime.ToVietnamLocalTime();

                return new SessionDetailIntegrationResponse(
                    s.Id,
                    s.Status.ToString(),
                    s.SessionNumber,
                    DateOnly.FromDateTime(localStartTime),
                    TimeOnly.FromDateTime(localStartTime),
                    TimeOnly.FromDateTime(localEndTime),
                    s.ScheduleId,
                    s.AttendanceRecords.Select(ar => new AttendanceRecordIntegrationResponse(
                        ar.Id,
                        ar.StudentId,
                        ar.Status.ToString()
                    )).ToList()
                );
            }).ToList();

        return new GetSessionsByScheduleIdsIntegrationResponse(responseData);
    }
}