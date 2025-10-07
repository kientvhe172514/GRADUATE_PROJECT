using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Attendance;

namespace Zentry.Modules.AttendanceManagement.Application.Integrations;

public class GetUpcomingSessionsByScheduleIdsIntegrationQueryHandler(ISessionRepository sessionRepository)
    : IQueryHandler<GetUpcomingSessionsByScheduleIdsIntegrationQuery,
        GetUpcomingSessionsByScheduleIdsIntegrationResponse>
{
    public async Task<GetUpcomingSessionsByScheduleIdsIntegrationResponse> Handle(
        GetUpcomingSessionsByScheduleIdsIntegrationQuery query,
        CancellationToken cancellationToken)
    {
        var sessions =
            await sessionRepository.GetUpcomingSessionsByScheduleIdsAsync(query.ScheduleIds, cancellationToken);

        var dtos = sessions.Select(s => new UpcomingSessionDto
        {
            Id = s.Id,
            ScheduleId = s.ScheduleId,
            Status = s.Status.ToString().ToLower(),
            StartTime = s.StartTime,
            EndTime = s.EndTime
        }).ToList();

        return new GetUpcomingSessionsByScheduleIdsIntegrationResponse(dtos);
    }
}