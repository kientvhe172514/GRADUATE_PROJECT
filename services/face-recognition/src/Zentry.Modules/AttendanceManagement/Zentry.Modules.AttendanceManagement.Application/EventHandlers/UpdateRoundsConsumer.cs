using MassTransit;
using Microsoft.Extensions.Logging;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.Modules.AttendanceManagement.Domain.Entities;
using Zentry.SharedKernel.Contracts.Events;

namespace Zentry.Modules.AttendanceManagement.Application.EventHandlers;

public class UpdateRoundsConsumer(
    ILogger<UpdateRoundsConsumer> logger,
    IRoundRepository roundRepository,
    ISessionRepository sessionRepository)
    : IConsumer<UpdateRoundsForSessionMessage>
{
    public async Task Consume(ConsumeContext<UpdateRoundsForSessionMessage> consumeContext)
    {
        var message = consumeContext.Message;
        logger.LogInformation("MassTransit Consumer: Received request to update rounds for Session: {SessionId}.",
            message.SessionId);

        try
        {
            var session = await sessionRepository.GetByIdAsync(message.SessionId, consumeContext.CancellationToken);
            if (session is null)
            {
                logger.LogWarning("UpdateRounds failed: Session {SessionId} not found. Skipping round update.",
                    message.SessionId);
                return;
            }

            var existingRounds =
                await roundRepository.GetRoundsBySessionIdAsync(session.Id, consumeContext.CancellationToken);
            await roundRepository.DeleteRangeAsync(existingRounds, consumeContext.CancellationToken);
            await roundRepository.SaveChangesAsync(consumeContext.CancellationToken);
            logger.LogInformation("Deleted {NumRounds} existing rounds for Session {SessionId}.", existingRounds.Count,
                session.Id);

            var roundsToAdd = new List<Round>();
            var totalDuration = session.EndTime.Subtract(session.StartTime);
            var durationPerRoundSeconds = totalDuration.TotalSeconds / session.TotalAttendanceRounds;

            for (var i = 1; i <= session.TotalAttendanceRounds; i++)
            {
                var roundStartTime = session.StartTime.AddSeconds(durationPerRoundSeconds * (i - 1));
                var roundEndTime = roundStartTime.AddSeconds(durationPerRoundSeconds);

                if (i == session.TotalAttendanceRounds) roundEndTime = session.EndTime;

                var newRound = Round.Create(
                    session.Id,
                    i,
                    roundStartTime,
                    roundEndTime
                );
                roundsToAdd.Add(newRound);
            }

            if (roundsToAdd.Count > 0)
            {
                await roundRepository.AddRangeAsync(roundsToAdd, consumeContext.CancellationToken);
                await roundRepository.SaveChangesAsync(consumeContext.CancellationToken);
                logger.LogInformation("Successfully created {NumRounds} new rounds for Session {SessionId}.",
                    roundsToAdd.Count, session.Id);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "MassTransit Consumer: Error updating rounds for Session {SessionId}.",
                message.SessionId);
            throw;
        }
    }
}