using MediatR;
using Microsoft.Extensions.Logging;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.Modules.AttendanceManagement.Domain.Entities;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Attendance;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.AttendanceManagement.Application.Features.CancelSession;

public class CancelSessionCommandHandler(
    ISessionRepository sessionRepository,
    IRoundRepository roundRepository,
    ILogger<CancelSessionCommandHandler> logger)
    : ICommandHandler<CancelSessionCommand, Unit>
{
    public async Task<Unit> Handle(CancelSessionCommand request, CancellationToken cancellationToken)
    {
        logger.LogInformation("Attempting to cancel session {SessionId}.", request.SessionId);

        var session = await sessionRepository.GetByIdAsync(request.SessionId, cancellationToken);
        if (session is null)
        {
            logger.LogWarning("CancelSession failed: Session with ID {SessionId} not found.", request.SessionId);
            throw new ResourceNotFoundException(nameof(Session), request.SessionId);
        }

        if (Equals(session.Status, SessionStatus.Cancelled))
        {
            logger.LogInformation("Session {SessionId} is already cancelled. No action needed.", session.Id);
            return Unit.Value;
        }

        if (Equals(session.Status, SessionStatus.Active))
        {
            logger.LogWarning("CancelSession failed: Session {SessionId} is currently active and cannot be cancelled.",
                session.Id);
            throw new BusinessRuleException("CANNOT_CANCEL_ACTIVE_SESSION", "Không thể hủy session đang hoạt động.");
        }

        var rounds = await roundRepository.GetRoundsBySessionIdAsync(session.Id, cancellationToken);
        if (rounds.Any())
        {
            foreach (var round in rounds)
                if (!Equals(round.Status, RoundStatus.Completed))
                    round.CancelRound();

            await roundRepository.UpdateRangeAsync(rounds, cancellationToken);
        }

        session.CancelSession();
        await sessionRepository.UpdateAsync(session, cancellationToken);
        await sessionRepository.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Session {SessionId} and its rounds cancelled successfully.", session.Id);
        return Unit.Value;
    }
}