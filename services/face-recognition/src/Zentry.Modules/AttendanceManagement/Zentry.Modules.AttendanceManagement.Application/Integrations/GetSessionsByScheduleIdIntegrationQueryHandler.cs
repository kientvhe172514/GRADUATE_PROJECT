using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Attendance;

namespace Zentry.Modules.AttendanceManagement.Application.Integrations;

public class GetSessionsByScheduleIdIntegrationQueryHandler(ISessionRepository sessionRepository)
    : IQueryHandler<GetSessionsByScheduleIdIntegrationQuery, List<GetSessionsByScheduleIdIntegrationResponse>>
{
    public async Task<List<GetSessionsByScheduleIdIntegrationResponse>> Handle(
        GetSessionsByScheduleIdIntegrationQuery query,
        CancellationToken cancellationToken)
    {
        var sessions = await sessionRepository.GetSessionsByScheduleIdAsync(query.ScheduleId, cancellationToken);

        var response = sessions.Select(s => new GetSessionsByScheduleIdIntegrationResponse
        {
            SessionId = s.Id,
            ScheduleId = s.ScheduleId,
            Status = s.Status.ToString(),
            StartTime = s.StartTime,
            EndTime = s.EndTime
        }).ToList();

        return response;
    }
}