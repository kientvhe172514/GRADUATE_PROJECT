using MassTransit;
using Microsoft.Extensions.Logging;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.Modules.AttendanceManagement.Domain.Entities;
using Zentry.SharedKernel.Contracts.Events;

namespace Zentry.Modules.AttendanceManagement.Application.EventHandlers;

public class CreateRoundsConsumer(
    ILogger<CreateRoundsConsumer> logger,
    IRoundRepository roundRepository,
    ISessionRepository sessionRepository)
    : IConsumer<CreateRoundsMessage>
{
    public async Task Consume(ConsumeContext<CreateRoundsMessage> consumeContext)
    {
        var message = consumeContext.Message;
        logger.LogInformation(
            "MassTransit Consumer: Received request to create rounds for Session: {SessionId}. Total rounds: {TotalRounds}.",
            message.SessionId, message.TotalAttendanceRounds);

        try
        {
            var session = await sessionRepository.GetByIdAsync(message.SessionId, consumeContext.CancellationToken);
            if (session is null)
            {
                logger.LogWarning(
                    "CreateSessionRounds failed: Session with ID {SessionId} not found. Skipping round creation.",
                    message.SessionId);
                return;
            }

            var totalDuration = session.EndTime.Subtract(session.StartTime);

            if (session.TotalAttendanceRounds <= 0)
            {
                logger.LogInformation(
                    "No rounds to create for Session {SessionId}. TotalAttendanceRounds is {TotalRounds}.", session.Id,
                    session.TotalAttendanceRounds);
                return;
            }

            var durationPerRoundSeconds = totalDuration.TotalSeconds / session.TotalAttendanceRounds;

            var roundsToAdd = new List<Round>();

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
                logger.LogInformation(
                    "MassTransit Consumer: Successfully created and saved {NumRounds} rounds for Session {SessionId}.",
                    roundsToAdd.Count, message.SessionId);
            }
            else
            {
                logger.LogInformation("No rounds generated to add for Session {SessionId}.",
                    message.SessionId);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "MassTransit Consumer: Error creating rounds for Session {SessionId}. Message will be retried or moved to error queue.",
                message.SessionId);
            throw;
        }
    }
}