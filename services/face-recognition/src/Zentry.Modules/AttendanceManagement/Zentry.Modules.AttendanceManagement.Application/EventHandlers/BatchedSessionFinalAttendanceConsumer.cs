using MassTransit;
using Microsoft.Extensions.Logging;
using Zentry.Infrastructure.Caching;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.SharedKernel.Constants.Attendance;
using Zentry.SharedKernel.Contracts.Events;

namespace Zentry.Modules.AttendanceManagement.Application.EventHandlers;

public class BatchedSessionFinalAttendanceConsumer(
    ILogger<BatchedSessionFinalAttendanceConsumer> logger,
    IRedisService redisService,
    IPublishEndpoint publishEndpoint,
    IRoundRepository roundRepository,
    ISessionRepository sessionRepository)
    : IConsumer<BatchedSessionFinalAttendanceMessage>
{
    public async Task Consume(ConsumeContext<BatchedSessionFinalAttendanceMessage> context)
    {
        var message = context.Message;

        logger.LogInformation("Processing batched final attendance for session {SessionId}, Batch {BatchId}",
            message.SessionId, message.BatchId);

        var batchKey = $"final_processing_batch:{message.SessionId}";
        var processingLockKey = $"final_processing_in_progress:{message.SessionId}";

        try
        {
            var currentBatchId = await redisService.GetAsync<string>(batchKey);

            // FIXED: Add more detailed logging and null check
            if (string.IsNullOrEmpty(currentBatchId))
            {
                logger.LogWarning(
                    "No current batch found for session {SessionId}, BatchId {BatchId} - key may have expired",
                    message.SessionId, message.BatchId);

                // Check if processing is already in progress
                var processingInProgress = await redisService.GetAsync<string>(processingLockKey);
                if (processingInProgress != null)
                {
                    logger.LogInformation("Final processing already in progress for session {SessionId}, skipping",
                        message.SessionId);
                    return;
                }

                // If no processing in progress, allow this batch to proceed
                logger.LogInformation(
                    "No processing in progress, allowing batch {BatchId} to proceed for session {SessionId}",
                    message.BatchId, message.SessionId);
                currentBatchId = message.BatchId; // Use message BatchId
            }

            // Check if this is still the current batch (no newer late submissions)
            if (currentBatchId != message.BatchId)
            {
                logger.LogInformation(
                    "Batch {BatchId} is outdated (current: {CurrentBatchId}) for session {SessionId}, skipping",
                    message.BatchId, currentBatchId, message.SessionId);
                return;
            }

            // Try to acquire processing lock to ensure only one final processing runs
            var processingLockAcquired = await TryAcquireProcessingLock(processingLockKey);
            if (!processingLockAcquired)
            {
                logger.LogWarning(
                    "Final processing already in progress for Session {SessionId}, skipping batch {BatchId}",
                    message.SessionId, message.BatchId);
                return;
            }

            try
            {
                // Verify session is completed before processing
                var session = await sessionRepository.GetByIdAsync(message.SessionId, context.CancellationToken);
                if (session is null)
                {
                    logger.LogWarning("Session {SessionId} not found for batched final processing", message.SessionId);
                    return;
                }

                if (!Equals(session.Status, SessionStatus.Completed))
                {
                    logger.LogWarning(
                        "Session {SessionId} status is {Status}, not Completed. Skipping final processing",
                        message.SessionId, session.Status.ToString());
                    return;
                }

                // Clean up batch marker first
                await redisService.RemoveAsync(batchKey);

                // Get actual completed rounds count
                var allRounds =
                    await roundRepository.GetRoundsBySessionIdAsync(message.SessionId, context.CancellationToken);
                var completedRoundsCount = allRounds.Count(r => Equals(r.Status, RoundStatus.Completed));

                // Publish final attendance processing
                var finalMessage = new SessionFinalAttendanceToProcessMessage
                {
                    SessionId = message.SessionId,
                    ActualRoundsCount = completedRoundsCount
                };

                await publishEndpoint.Publish(finalMessage, context.CancellationToken);

                logger.LogInformation(
                    "Published final attendance processing for session {SessionId} with {ActualRounds} rounds (Batch {BatchId})",
                    message.SessionId, completedRoundsCount, message.BatchId);
            }
            finally
            {
                // Always release processing lock
                await redisService.RemoveAsync(processingLockKey);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error in batched final processing for session {SessionId}, Batch {BatchId}",
                message.SessionId, message.BatchId);

            // Clean up both keys on error to allow retry
            try
            {
                await redisService.RemoveAsync(batchKey);
                await redisService.RemoveAsync(processingLockKey);
            }
            catch (Exception cleanupEx)
            {
                logger.LogWarning(cleanupEx, "Error during cleanup for Session {SessionId}", message.SessionId);
            }

            throw;
        }
    }

    private async Task<bool> TryAcquireProcessingLock(string lockKey)
    {
        try
        {
            var existing = await redisService.GetAsync<string>(lockKey);
            if (existing != null)
                return false;

            await redisService.SetAsync(lockKey, DateTime.UtcNow.ToString(), TimeSpan.FromMinutes(2));
            return true;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Error acquiring processing lock {LockKey}", lockKey);
            return false;
        }
    }
}