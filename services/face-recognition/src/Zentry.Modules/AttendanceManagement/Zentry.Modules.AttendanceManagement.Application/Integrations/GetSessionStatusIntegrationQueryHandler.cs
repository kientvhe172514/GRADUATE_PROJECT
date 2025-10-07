using Microsoft.Extensions.Logging;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Attendance;

namespace Zentry.Modules.AttendanceManagement.Application.Integrations;

public class GetSessionStatusIntegrationQueryHandler(
    ISessionRepository sessionRepository,
    ILogger<GetSessionStatusIntegrationQueryHandler> logger)
    : IQueryHandler<GetSessionStatusIntegrationQuery, SessionStatusDto>
{
    public async Task<SessionStatusDto> Handle(GetSessionStatusIntegrationQuery request,
        CancellationToken cancellationToken)
    {
        // Logic để lấy session của scheduleId và ngày hôm đó
        var session =
            await sessionRepository.GetSessionByScheduleIdAndDateAsync(request.ScheduleId, request.SessionDate,
                cancellationToken);

        if (session is not null)
            return new SessionStatusDto
            {
                Status = session.Status.ToString() // Sử dụng .Name của Enumeration
            };
        logger.LogWarning("No session found for ScheduleId: {ScheduleId} on date: {SessionDate}", request.ScheduleId,
            request.SessionDate);
        return null;
    }
}