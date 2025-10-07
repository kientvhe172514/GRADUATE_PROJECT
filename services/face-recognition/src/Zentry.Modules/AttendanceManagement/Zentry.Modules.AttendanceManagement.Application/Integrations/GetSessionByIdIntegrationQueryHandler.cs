using Microsoft.Extensions.Logging;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Attendance;

namespace Zentry.Modules.AttendanceManagement.Application.Integrations;

public class GetSessionByIdIntegrationQueryHandler(
    ISessionRepository sessionRepository,
    ILogger<GetSessionByIdIntegrationQueryHandler> logger)
    : IQueryHandler<GetSessionByIdIntegrationQuery, SessionByIdDto>
{
    public async Task<SessionByIdDto> Handle(GetSessionByIdIntegrationQuery request,
        CancellationToken cancellationToken)
    {
        var session = await sessionRepository.GetByIdAsync(request.SessionId, cancellationToken);

        if (session is not null)
        {
            logger.LogInformation("Session {SessionId} found with status {Status}",
                request.SessionId, session.Status.ToString());

            return new SessionByIdDto
            {
                Id = session.Id,
                Status = session.Status.ToString(),
                StartTime = session.StartTime,
                EndTime = session.EndTime
            };
        }

        logger.LogWarning("No session found for SessionId: {SessionId}", request.SessionId);
        return null;
    }
}