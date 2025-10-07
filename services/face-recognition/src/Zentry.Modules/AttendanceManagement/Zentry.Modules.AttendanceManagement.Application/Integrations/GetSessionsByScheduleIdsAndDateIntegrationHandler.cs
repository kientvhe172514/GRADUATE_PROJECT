using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Attendance;
using Zentry.SharedKernel.Extensions;

namespace Zentry.Modules.AttendanceManagement.Application.Integrations;

public class GetSessionsByScheduleIdsAndDateIntegrationHandler(
    ISessionRepository sessionRepository
) : IQueryHandler<GetSessionsByScheduleIdsAndDateIntegrationQuery, GetSessionsByScheduleIdsAndDateIntegrationResponse>
{
    public async Task<GetSessionsByScheduleIdsAndDateIntegrationResponse> Handle(
        GetSessionsByScheduleIdsAndDateIntegrationQuery request,
        CancellationToken cancellationToken)
    {
        var sessions = await sessionRepository.GetSessionsByScheduleIdsAndDateAsync(
            request.ScheduleIds,
            request.Date,
            cancellationToken);

        var sessionsByScheduleId = sessions
            .ToDictionary(
                s => s.ScheduleId,
                s =>
                {
                    var localStartTime = s.StartTime.ToVietnamLocalTime();
                    var localEndTime = s.EndTime.ToVietnamLocalTime();

                    return new SessionInfoForDateIntegrationResponse(
                        s.Id,
                        s.Status.ToString(),
                        DateOnly.FromDateTime(localStartTime),
                        TimeOnly.FromDateTime(localStartTime),
                        TimeOnly.FromDateTime(localEndTime)
                    );
                }
            );

        return new GetSessionsByScheduleIdsAndDateIntegrationResponse(sessionsByScheduleId);
    }
}