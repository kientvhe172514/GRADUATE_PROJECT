using MediatR;
using Microsoft.Extensions.Logging;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Attendance;

namespace Zentry.Modules.AttendanceManagement.Application.Integrations;

public class DeleteSessionsByScheduleIdIntegrationCommandHandler(
    ISessionRepository sessionRepository,
    ILogger<DeleteSessionsByScheduleIdIntegrationCommandHandler> logger)
    : ICommandHandler<DeleteSessionsByScheduleIdIntegrationCommand, Unit>
{
    public async Task<Unit> Handle(DeleteSessionsByScheduleIdIntegrationCommand command,
        CancellationToken cancellationToken)
    {
        logger.LogInformation("Attempting to delete sessions for ScheduleId: {ScheduleId}.", command.ScheduleId);

        try
        {
            var sessionsToDelete =
                await sessionRepository.GetSessionsByScheduleIdAsync(command.ScheduleId, cancellationToken);

            if (sessionsToDelete.Count == 0)
            {
                logger.LogInformation("No sessions found to delete for ScheduleId: {ScheduleId}.", command.ScheduleId);
                return Unit.Value;
            }

            await sessionRepository.DeleteRangeAsync(sessionsToDelete, cancellationToken);

            logger.LogInformation("Successfully deleted {Count} sessions for ScheduleId: {ScheduleId}.",
                sessionsToDelete.Count, command.ScheduleId);

            return Unit.Value;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to delete sessions for ScheduleId: {ScheduleId}.", command.ScheduleId);
            throw;
        }
    }
}