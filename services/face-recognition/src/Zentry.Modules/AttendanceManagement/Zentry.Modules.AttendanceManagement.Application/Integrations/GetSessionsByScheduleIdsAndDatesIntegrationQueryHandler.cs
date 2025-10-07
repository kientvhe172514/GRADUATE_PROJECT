using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Schedule;

namespace Zentry.Modules.AttendanceManagement.Application.Integrations;

public class GetSessionsByScheduleIdsAndDatesIntegrationQueryHandler(ISessionRepository sessionRepository)
    : IQueryHandler<GetSessionsByScheduleIdsAndDatesIntegrationQuery,
        List<GetSessionsByScheduleIdAndDateIntegrationResponse>>
{
    public async Task<List<GetSessionsByScheduleIdAndDateIntegrationResponse>> Handle(
        GetSessionsByScheduleIdsAndDatesIntegrationQuery query,
        CancellationToken cancellationToken)
    {
        if (query.Lookups.Count == 0) return [];

        var scheduleIds = query.Lookups.Select(x => x.ScheduleId).Distinct().ToList();
        var dates = query.Lookups.Select(x => x.Date).Distinct().ToList();

        var sessions = await sessionRepository.GetSessionsByScheduleIdsAndDatesAsync(
            scheduleIds,
            dates,
            cancellationToken
        );

        // Ánh xạ kết quả sang DTO phản hồi.
        return sessions.Select(s => new GetSessionsByScheduleIdAndDateIntegrationResponse
        {
            ScheduleId = s.ScheduleId,
            SessionId = s.Id,
            Status = s.Status.ToString(),
            StartTime = s.StartTime,
            EndTime = s.EndTime
        }).ToList();
    }
}