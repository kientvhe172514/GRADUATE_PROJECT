using MassTransit;
using Microsoft.Extensions.Logging;
using Zentry.Infrastructure.Caching;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.Modules.AttendanceManagement.Application.Services.Interface;
using Zentry.SharedKernel.Constants.Attendance;
using Zentry.SharedKernel.Contracts.Events;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.AttendanceManagement.Application.EventHandlers;

public class ProcessActiveRoundForEndSessionConsumer(
    ILogger<ProcessActiveRoundForEndSessionConsumer> logger,
    ISessionRepository sessionRepository,
    IRoundRepository roundRepository,
    IPublishEndpoint publishEndpoint,
    IRedisService redisService,
    IAttendanceCalculationService attendanceCalculationService,
    IAttendancePersistenceService attendancePersistenceService)
    : IConsumer<ProcessActiveRoundForEndSessionMessage>
{
    public async Task Consume(ConsumeContext<ProcessActiveRoundForEndSessionMessage> context)
    {
        var message = context.Message;

        logger.LogInformation(
            "Processing active round {ActiveRoundId} for end session {SessionId}",
            message.ActiveRoundId, message.SessionId);

        try
        {
            var session = await sessionRepository.GetByIdAsync(message.SessionId, context.CancellationToken);
            if (session is null)
                throw new NotFoundException(nameof(ProcessActiveRoundForEndSessionConsumer), message.SessionId);

            // Get the active round
            var activeRound = await roundRepository.GetByIdAsync(message.ActiveRoundId, context.CancellationToken);
            if (activeRound is null)
                throw new NotFoundException(nameof(ProcessActiveRoundForEndSessionConsumer), message.ActiveRoundId);

            // Calculate attendance for active round - this will throw if scan data doesn't exist
            logger.LogInformation("Calculating attendance for active round {RoundId}", activeRound.Id);

            var calculationResult = await attendanceCalculationService.CalculateAttendanceForRound(
                session.Id,
                activeRound.Id,
                context.CancellationToken);

            // Persist attendance result
            await attendancePersistenceService.PersistAttendanceResult(
                activeRound,
                calculationResult.AttendedDeviceIds,
                context.CancellationToken);

            // Mark active round as completed
            activeRound.CompleteRound();
            await roundRepository.UpdateAsync(activeRound, context.CancellationToken);

            // Mark pending rounds as Finalized
            foreach (var pendingRoundId in message.PendingRoundIds)
            {
                var pendingRound = await roundRepository.GetByIdAsync(pendingRoundId, context.CancellationToken);
                if (pendingRound is not null)
                {
                    pendingRound.UpdateStatus(RoundStatus.Finalized);
                    await roundRepository.UpdateAsync(pendingRound, context.CancellationToken);
                    logger.LogInformation("Pending round {RoundId} marked as Finalized", pendingRoundId);
                }
            }

            // Save all round changes
            await roundRepository.SaveChangesAsync(context.CancellationToken);

            // Complete session
            session.CompleteSession();
            await sessionRepository.UpdateAsync(session, context.CancellationToken);
            await sessionRepository.SaveChangesAsync(context.CancellationToken);
            logger.LogInformation("Session {SessionId} status updated to Completed.", session.Id);

            // Clean up Redis
            var activeScheduleKey = $"active_schedule:{session.ScheduleId}";
            await redisService.RemoveAsync($"session:{session.Id}");
            await redisService.RemoveAsync(activeScheduleKey);
            logger.LogInformation("Redis keys for Session {SessionId} and Schedule {ScheduleId} deleted.",
                session.Id, session.ScheduleId);

            // Get total completed rounds for final processing
            var allRounds = await roundRepository.GetRoundsBySessionIdAsync(session.Id, context.CancellationToken);
            var completedRoundsCount = allRounds.Count(r => Equals(r.Status, RoundStatus.Completed));

            // Publish final attendance processing message
            var finalMessage = new SessionFinalAttendanceToProcessMessage
            {
                SessionId = session.Id,
                ActualRoundsCount = completedRoundsCount
            };
            await publishEndpoint.Publish(finalMessage, context.CancellationToken);
            logger.LogInformation(
                "SessionFinalAttendanceToProcess message published for Session {SessionId} with {ActualRounds} actual rounds.",
                session.Id, completedRoundsCount);

            logger.LogInformation("Active round {RoundId} processing completed successfully", activeRound.Id);
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Error processing active round {ActiveRoundId} for end session {SessionId}. Will retry.",
                message.ActiveRoundId, message.SessionId);

            // Rethrow to trigger retry mechanism
            throw;
        }
    }
}