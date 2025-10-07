using MediatR;
using Microsoft.Extensions.Logging;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.Modules.AttendanceManagement.Domain.Entities;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Attendance;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.AttendanceManagement.Application.Features.DeleteSession;

public class DeleteSessionCommandHandler(
    ISessionRepository sessionRepository,
    IRoundRepository roundRepository,
    ILogger<DeleteSessionCommandHandler> logger)
    : ICommandHandler<DeleteSessionCommand, Unit>
{
    public async Task<Unit> Handle(DeleteSessionCommand request, CancellationToken cancellationToken)
    {
        logger.LogInformation("Attempting to delete session {SessionId}.", request.SessionId);

        var session = await sessionRepository.GetByIdAsync(request.SessionId, cancellationToken);
        if (session is null)
        {
            logger.LogWarning("DeleteSession failed: Session with ID {SessionId} not found.", request.SessionId);
            throw new ResourceNotFoundException(nameof(Session), request.SessionId);
        }

        if (!Equals(session.Status, SessionStatus.Pending))
        {
            logger.LogWarning(
                "DeleteSession failed: Session {SessionId} cannot be deleted because its status is {Status}, not Pending.",
                session.Id, session.Status);
            throw new BusinessRuleException("SESSION_NOT_PENDING", "Chỉ có thể xóa session ở trạng thái Pending.");
        }

        var sessionDate = session.StartTime.Date;
        var todayDate = DateTime.UtcNow.Date;
        if (sessionDate == todayDate)
        {
            logger.LogWarning(
                "DeleteSession failed: Session {SessionId} cannot be deleted as it is scheduled for today.",
                request.SessionId);
            throw new BusinessRuleException("CANNOT_DELETE_TODAY_SESSION",
                "Không thể xóa session diễn ra trong ngày hôm nay.");
        }

        var rounds = await roundRepository.GetRoundsBySessionIdAsync(session.Id, cancellationToken);
        if (rounds.Count != 0)
        {
            await roundRepository.DeleteRangeAsync(rounds, cancellationToken);
            await roundRepository.SaveChangesAsync(cancellationToken);
            logger.LogInformation("Deleted {NumRounds} associated rounds for session {SessionId}.", rounds.Count,
                session.Id);
        }

        await sessionRepository.DeleteAsync(session, cancellationToken);
        await sessionRepository.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Session {SessionId} deleted successfully.", session.Id);

        return Unit.Value;
    }
}