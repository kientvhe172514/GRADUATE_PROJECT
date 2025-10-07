using MassTransit;
using Microsoft.Extensions.Logging;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.Modules.AttendanceManagement.Domain.Entities;
using Zentry.SharedKernel.Constants.Attendance;
using Zentry.SharedKernel.Contracts.Events;
using Zentry.SharedKernel.Extensions;

namespace Zentry.Modules.AttendanceManagement.Application.EventHandlers;

public class UpdateSessionConsumer(
    ILogger<UpdateSessionConsumer> logger,
    ISessionRepository sessionRepository)
    : IConsumer<ScheduleUpdatedMessage>
{
    public async Task Consume(ConsumeContext<ScheduleUpdatedMessage> context)
    {
        var message = context.Message;
        logger.LogInformation(
            "MassTransit Consumer: Received ScheduleUpdatedMessage for ScheduleId: {ScheduleId}.",
            message.ScheduleId);

        try
        {
            var sessions =
                await sessionRepository.GetSessionsByScheduleIdAsync(message.ScheduleId, context.CancellationToken);

            if (sessions.Count == 0)
            {
                logger.LogWarning("No sessions found for ScheduleId: {ScheduleId} to update.", message.ScheduleId);
                return;
            }

            var sessionsToUpdate = new List<Session>();
            var skippedSessions = new List<(Guid SessionId, SessionStatus Status)>();

            foreach (var session in sessions)
            {
                // Chỉ update những session có status là Pending
                if (!Equals(session.Status, SessionStatus.Pending))
                {
                    skippedSessions.Add((session.Id, session.Status));
                    logger.LogInformation(
                        "Skipping session {SessionId} for update as its status is {Status} (only Pending sessions can be updated).",
                        session.Id, session.Status);
                    continue;
                }

                var newStartTime = message.StartTime;
                var newEndTime = message.EndTime;

                if (newStartTime.HasValue && newEndTime.HasValue)
                {
                    var sessionDate = DateOnly.FromDateTime(session.StartTime.ToVietnamLocalTime());
                    var newLocalStartTime = sessionDate.ToDateTime(newStartTime.Value);
                    var newLocalEndTime = sessionDate.ToDateTime(newEndTime.Value);

                    var newUtcStartTime = newLocalStartTime.ToUtcFromVietnamLocalTime();
                    var newUtcEndTime = newLocalEndTime.ToUtcFromVietnamLocalTime();

                    // Chỉ update nếu thực sự có thay đổi
                    if (session.StartTime != newUtcStartTime || session.EndTime != newUtcEndTime)
                    {
                        session.Update(newUtcStartTime, newUtcEndTime);
                        sessionsToUpdate.Add(session);

                        logger.LogDebug(
                            "Session {SessionId} will be updated: {OldStart} -> {NewStart}, {OldEnd} -> {NewEnd}",
                            session.Id, session.StartTime, newUtcStartTime, session.EndTime, newUtcEndTime);
                    }
                }
            }

            // Log summary của các sessions bị skip
            if (skippedSessions.Count > 0)
            {
                var statusGroups = skippedSessions.GroupBy(s => s.Status).ToDictionary(g => g.Key, g => g.Count());
                var statusSummary = string.Join(", ", statusGroups.Select(kv => $"{kv.Key}: {kv.Value}"));
                logger.LogInformation(
                    "Skipped {TotalSkipped} sessions for ScheduleId {ScheduleId} by status: {StatusSummary}",
                    skippedSessions.Count, message.ScheduleId, statusSummary);
            }

            if (sessionsToUpdate.Count > 0)
            {
                await sessionRepository.UpdateRangeAsync(sessionsToUpdate, context.CancellationToken);
                await sessionRepository.SaveChangesAsync(context.CancellationToken);
                logger.LogInformation(
                    "Successfully updated {UpdatedCount} pending sessions for ScheduleId: {ScheduleId} (Total sessions: {TotalSessions}, Skipped: {SkippedCount}).",
                    sessionsToUpdate.Count, message.ScheduleId, sessions.Count, skippedSessions.Count);
            }
            else
            {
                logger.LogInformation(
                    "No pending sessions to update for ScheduleId: {ScheduleId} (Total sessions: {TotalSessions}, All skipped: {SkippedCount}).",
                    message.ScheduleId, sessions.Count, skippedSessions.Count);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "MassTransit Consumer: Error processing ScheduleUpdatedMessage for ScheduleId {ScheduleId}.",
                message.ScheduleId);
            throw;
        }
    }
}