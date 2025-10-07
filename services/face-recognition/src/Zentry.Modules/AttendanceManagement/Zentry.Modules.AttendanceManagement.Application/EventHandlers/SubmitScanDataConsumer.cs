using MassTransit;
using MediatR;
using Microsoft.Extensions.Logging;
using Zentry.Infrastructure.Caching;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.Modules.AttendanceManagement.Application.Services.Interface;
using Zentry.Modules.AttendanceManagement.Domain.Entities;
using Zentry.Modules.AttendanceManagement.Domain.ValueObjects;
using Zentry.SharedKernel.Constants.Attendance;
using Zentry.SharedKernel.Contracts.Device;
using Zentry.SharedKernel.Contracts.Events;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.AttendanceManagement.Application.EventHandlers;

public class SubmitScanDataConsumer(
    ILogger<SubmitScanDataConsumer> logger,
    IScanLogRepository scanLogRepository,
    IRoundRepository roundRepository,
    IRoundTrackRepository roundTrackRepository,
    ISessionRepository sessionRepository,
    IPublishEndpoint publishEndpoint,
    IRedisService redisService,
    IAttendanceCalculationService attendanceCalculationService,
    IAttendancePersistenceService attendancePersistenceService,
    IMediator mediator)
    : IConsumer<SubmitScanDataMessage>
{
    private const int MinValidNeighborsForLateSubmission = 1;
    private readonly TimeSpan _batchWindow = TimeSpan.FromMinutes(1);
    private readonly TimeSpan _maxLateSubmissionWindow = TimeSpan.FromMinutes(90);

    public async Task Consume(ConsumeContext<SubmitScanDataMessage> consumeContext)
    {
        var message = consumeContext.Message;
        logger.LogInformation(
            "Processing scan data for SessionId: {SessionId}, Submitter: {SubmitterAndroidId}, IsLate: {IsLate}",
            message.SessionId, message.SubmitterDeviceAndroidId, message.IsLateSubmission);

        try
        {
            // Get submitter device info
            var (submitterDeviceId, submitterUserId) =
                await GetSubmitterDeviceInfo(message, consumeContext.CancellationToken);
            if (submitterDeviceId == Guid.Empty) return; // Skip if invalid

            // Process scanned devices
            var finalScannedDevices = await ProcessScannedDevices(message, consumeContext.CancellationToken);
            if (finalScannedDevices.Count == 0)
            {
                logger.LogWarning("No valid scanned devices for Session {SessionId}", message.SessionId);
                return;
            }

            var round = await roundRepository.GetByIdAsync(message.RoundId, consumeContext.CancellationToken);
            if (round is null)
            {
                logger.LogError("Round {RoundId} not found", message.RoundId);
                return;
            }

            var session = await sessionRepository.GetByIdAsync(message.SessionId, consumeContext.CancellationToken);
            if (session is null)
            {
                logger.LogError("Session {SessionId} not found", message.SessionId);
                return;
            }

            // Use the IsLateSubmission flag from the message (set by CommandHandler)
            if (message.IsLateSubmission)
                await HandleLateSubmission(message, session, round, submitterDeviceId,
                    submitterUserId, finalScannedDevices, consumeContext.CancellationToken);
            else
                await HandleNormalSubmission(message, submitterDeviceId, submitterUserId,
                    finalScannedDevices, consumeContext.CancellationToken);

            logger.LogInformation("Successfully processed scan data for SessionId: {SessionId}", message.SessionId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing scan data for SessionId {SessionId}", message.SessionId);
            throw;
        }
    }

    private async Task HandleLateSubmission(
        SubmitScanDataMessage message,
        Session session,
        Round round,
        Guid submitterDeviceId,
        Guid submitterUserId,
        List<ScannedDevice> finalScannedDevices,
        CancellationToken cancellationToken)
    {
        logger.LogInformation(
            "Handling late submission for session {SessionId}, Round {RoundId}, Submitter {SubmitterId}",
            session.Id, round.Id, submitterUserId);

        // Validate late submission
        if (!await IsValidLateSubmission(message, round, finalScannedDevices, cancellationToken))
        {
            logger.LogWarning(
                "Late submission rejected for Round {RoundId}, Submitter {SubmitterId} - validation failed",
                round.Id, submitterUserId);
            return;
        }

        // Save scan log
        await SaveScanLog(message, submitterDeviceId, submitterUserId, finalScannedDevices);

        // Only recalculate if round is completed
        if (Equals(round.Status, RoundStatus.Completed))
        {
            await RecalculateRoundAttendance(message.SessionId, round.Id, cancellationToken);

            // Schedule batched final processing only for completed sessions
            if (Equals(session.Status, SessionStatus.Completed))
                await ScheduleBatchedFinalProcessing(session.Id, cancellationToken);
        }
        else
        {
            logger.LogInformation(
                "Round {RoundId} status is {Status}, no recalculation needed",
                round.Id, round.Status.ToString());
        }
    }

    private async Task HandleNormalSubmission(
        SubmitScanDataMessage message,
        Guid submitterDeviceId,
        Guid submitterUserId,
        List<ScannedDevice> finalScannedDevices,
        CancellationToken cancellationToken)
    {
        // Save scan log
        await SaveScanLog(message, submitterDeviceId, submitterUserId, finalScannedDevices);

        // Update round status to Active if first submission
        await roundRepository.UpdateRoundStatusAsync(message.RoundId, RoundStatus.Active, cancellationToken);

        logger.LogInformation("Normal submission processed for Round {RoundId}", message.RoundId);
    }

    private async Task RecalculateRoundAttendance(Guid sessionId, Guid roundId, CancellationToken cancellationToken)
    {
        try
        {
            var round = await roundRepository.GetByIdAsync(roundId, cancellationToken);
            if (round is null) return;

            logger.LogInformation("Recalculating attendance for Round {RoundId} due to late submission", roundId);

            // Calculate attendance using service
            var calculationResult = await attendanceCalculationService.CalculateAttendanceForRound(
                sessionId, roundId, cancellationToken);

            // Persist results - this will update existing attendance records
            await attendancePersistenceService.PersistAttendanceResult(
                round, calculationResult.AttendedDeviceIds, cancellationToken);

            logger.LogInformation("Successfully recalculated attendance for Round {RoundId}: {Count} devices attended",
                roundId, calculationResult.AttendedDeviceIds.Count);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error recalculating attendance for Round {RoundId}", roundId);
            // Don't rethrow - we want to continue with final processing scheduling
        }
    }

    private async Task ScheduleBatchedFinalProcessing(Guid sessionId, CancellationToken cancellationToken)
    {
        var batchKey = $"final_processing_batch:{sessionId}";
        var lockKey = $"final_processing_lock:{sessionId}";

        try
        {
            // Use Redis to implement debouncing
            var existingBatch = await redisService.GetAsync<string>(batchKey);
            if (existingBatch != null)
            {
                // Already scheduled, just extend the window (debouncing)
                // FIXED: Extend TTL to be longer than batch window + processing buffer
                var extendedExpiry = _batchWindow.Add(TimeSpan.FromMinutes(5)); // Add 5 minutes buffer
                await redisService.SetAsync(batchKey, Guid.NewGuid().ToString(), extendedExpiry);
                logger.LogDebug("Extended batch window for session {SessionId}", sessionId);
                return;
            }

            // Try to acquire lock to prevent concurrent scheduling
            var lockAcquired = await TryAcquireLock(lockKey, TimeSpan.FromMinutes(10));
            if (!lockAcquired)
            {
                logger.LogDebug("Final processing already being scheduled for session {SessionId}", sessionId);
                return;
            }

            // Set batch marker
            var batchId = Guid.NewGuid().ToString();

            // FIXED: Set expiry longer than delay + processing buffer
            var batchExpiry = _batchWindow.Add(TimeSpan.FromMinutes(5)); // Add 5 minutes buffer
            await redisService.SetAsync(batchKey, batchId, batchExpiry);

            // Schedule delayed message for batch processing
            var scheduledTime = DateTime.UtcNow.Add(_batchWindow);
            var scheduledMessage = new BatchedSessionFinalAttendanceMessage
            {
                SessionId = sessionId,
                ScheduledProcessTime = scheduledTime,
                BatchId = batchId,
                Timestamp = DateTime.UtcNow
            };

            // Use MassTransit delay feature
            await publishEndpoint.Publish(scheduledMessage,
                context => { context.Delay = _batchWindow; }, cancellationToken);

            logger.LogInformation(
                "Scheduled batched final processing for session {SessionId} at {ScheduledTime} with BatchId {BatchId}",
                sessionId, scheduledTime, batchId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error scheduling batched final processing for session {SessionId}", sessionId);
        }
        finally
        {
            // Always try to release lock
            try
            {
                await redisService.RemoveAsync(lockKey);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Error releasing lock for session {SessionId}", sessionId);
            }
        }
    }

    private async Task<bool> TryAcquireLock(string lockKey, TimeSpan expiry)
    {
        try
        {
            // Simple distributed lock using Redis
            var existing = await redisService.GetAsync<string>(lockKey);
            if (existing != null)
                return false;

            await redisService.SetAsync(lockKey, DateTime.UtcNow.ToString(), expiry);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Error acquiring lock {LockKey}", lockKey);
            return false;
        }
    }

    private async Task<bool> IsValidLateSubmission(
        SubmitScanDataMessage message,
        Round round,
        List<ScannedDevice> finalScannedDevices,
        CancellationToken cancellationToken)
    {
        // 1. Check if timestamp is within acceptable late window
        var timeSinceSubmission = DateTime.UtcNow - message.Timestamp;
        if (timeSinceSubmission > _maxLateSubmissionWindow)
        {
            logger.LogWarning("Late submission too late: {TimeSinceSubmission} > {MaxWindow}",
                timeSinceSubmission, _maxLateSubmissionWindow);
            return false;
        }

        // 2. Check if timestamp is actually within the round period
        if (message.Timestamp < round.StartTime || message.Timestamp > round.EndTime)
        {
            logger.LogWarning("Timestamp {Timestamp} not within round period [{Start}, {End}]",
                message.Timestamp, round.StartTime, round.EndTime);
            return false;
        }

        // 3. For completed rounds, validate against existing attendance
        if (Equals(round.Status, RoundStatus.Completed))
        {
            var existingAttendance = await GetExistingAttendance(round.Id, cancellationToken);
            if (!existingAttendance.Any())
            {
                logger.LogWarning("No existing attendance found for completed Round {RoundId}", round.Id);
                return false;
            }

            // 4. Check if scanned devices include attended students (neighbor validation)
            var scannedDeviceIds = finalScannedDevices.Select(d => d.DeviceId).ToHashSet();
            var attendedDeviceIds = existingAttendance.ToHashSet();
            var validNeighbors = scannedDeviceIds.Intersect(attendedDeviceIds).Count();

            if (validNeighbors < MinValidNeighborsForLateSubmission)
            {
                logger.LogWarning("Insufficient valid neighbors: {ValidNeighbors} < {MinRequired}",
                    validNeighbors, MinValidNeighborsForLateSubmission);
                return false;
            }

            logger.LogInformation("Late submission validated: {ValidNeighbors} valid neighbors found", validNeighbors);
        }

        return true;
    }

    private async Task<List<string>> GetExistingAttendance(Guid roundId, CancellationToken cancellationToken)
    {
        try
        {
            var roundTrack = await roundTrackRepository.GetRoundTracksByRoundIdAsync(roundId, cancellationToken);
            if (roundTrack?.Students == null) return new List<string>();

            return roundTrack.Students
                .Where(s => s.IsAttended)
                .Select(s => s.DeviceId)
                .ToList();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error getting existing attendance for Round {RoundId}", roundId);
            return new List<string>();
        }
    }

    private async Task SaveScanLog(
        SubmitScanDataMessage message,
        Guid submitterDeviceId,
        Guid submitterUserId,
        List<ScannedDevice> finalScannedDevices)
    {
        var record = ScanLog.Create(
            Guid.NewGuid(),
            submitterDeviceId,
            submitterUserId,
            message.SessionId,
            message.RoundId,
            message.Timestamp,
            finalScannedDevices
        );

        await scanLogRepository.AddScanDataAsync(record);
        logger.LogInformation("Scan log saved for Session {SessionId}, Round {RoundId}, Late: {IsLate}",
            message.SessionId, message.RoundId, message.IsLateSubmission);
    }

    private async Task<(Guid deviceId, Guid userId)> GetSubmitterDeviceInfo(
        SubmitScanDataMessage message,
        CancellationToken cancellationToken)
    {
        try
        {
            var query = new GetDeviceByAndroidIdIntegrationQuery(message.SubmitterDeviceAndroidId);
            var response = await mediator.Send(query, cancellationToken);

            if (response.Device != null) return (response.Device.Id, response.Device.UserId);

            logger.LogError("Submitter device not found: {AndroidId}", message.SubmitterDeviceAndroidId);
            return (Guid.Empty, Guid.Empty);
        }
        catch (NotFoundException)
        {
            logger.LogError("Submitter device not found: {AndroidId}", message.SubmitterDeviceAndroidId);
            return (Guid.Empty, Guid.Empty);
        }
    }

    private async Task<List<ScannedDevice>> ProcessScannedDevices(
        SubmitScanDataMessage message,
        CancellationToken cancellationToken)
    {
        if (!message.ScannedDevices.Any()) return new List<ScannedDevice>();

        var androidIds = message.ScannedDevices.Select(sd => sd.AndroidId).ToList();
        var query = new GetDevicesByAndroidIdListIntegrationQuery(androidIds);
        var response = await mediator.Send(query, cancellationToken);

        var deviceMap = response.DeviceMappings.ToDictionary(
            m => m.AndroidId,
            m => m.DeviceId,
            StringComparer.OrdinalIgnoreCase
        );

        var result = new List<ScannedDevice>();
        foreach (var scannedDevice in message.ScannedDevices)
            if (deviceMap.TryGetValue(scannedDevice.AndroidId, out var deviceId))
                result.Add(new ScannedDevice(deviceId.ToString(), scannedDevice.Rssi));

        return result;
    }
}