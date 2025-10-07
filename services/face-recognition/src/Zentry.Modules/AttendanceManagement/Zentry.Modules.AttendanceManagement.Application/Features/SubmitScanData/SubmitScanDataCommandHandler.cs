using MassTransit;
using Microsoft.Extensions.Logging;
using Zentry.Infrastructure.Caching;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.Modules.AttendanceManagement.Domain.Entities;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Attendance;
using Zentry.SharedKernel.Constants.Response;
using Zentry.SharedKernel.Contracts.Events;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.AttendanceManagement.Application.Features.SubmitScanData;

public class SubmitScanDataCommandHandler(
    IRedisService redisService,
    ISessionRepository sessionRepository,
    IRoundRepository roundRepository,
    ILogger<SubmitScanDataCommandHandler> logger,
    IPublishEndpoint publishEndpoint)
    : ICommandHandler<SubmitScanDataCommand, SubmitScanDataResponse>
{
    public async Task<SubmitScanDataResponse> Handle(SubmitScanDataCommand request, CancellationToken cancellationToken)
    {
        logger.LogInformation(
            "Received SubmitScanDataCommand for Session {SessionId}, SubmitterDeviceAndroidId {SubmitterAndroidId}",
            request.SessionId, request.SubmitterDeviceAndroidId);

        // Logic mới để xác định round và loại submission
        var submissionDetails = await DetermineSubmissionDetailsAsync(
            request.SessionId,
            request.Timestamp,
            cancellationToken
        );

        // Kiểm tra session trước
        await ValidateSessionStatus(request.SessionId, cancellationToken);

        // Create message with late submission flag
        var message = new SubmitScanDataMessage(
            request.SubmitterDeviceAndroidId,
            request.SessionId,
            submissionDetails.Round.Id,
            request.ScannedDevices.Select(sd => new ScannedDeviceContractForMessage(sd.AndroidId, sd.Rssi))
                .ToList(),
            request.Timestamp,
            submissionDetails.IsLateSubmission
        );

        await publishEndpoint.Publish(message, cancellationToken);

        var responseMessage = submissionDetails.IsLateSubmission
            ? "Dữ liệu quét muộn đã được tiếp nhận và đưa vào hàng đợi xử lý."
            : "Dữ liệu quét đã được tiếp nhận và đưa vào hàng đợi xử lý.";

        logger.LogInformation(
            "Scan data message for Session {SessionId}, Submitter Android ID {SubmitterAndroidId} " +
            "published successfully with RoundId {RoundId} (Late: {IsLate})",
            request.SessionId, request.SubmitterDeviceAndroidId, submissionDetails.Round.Id,
            submissionDetails.IsLateSubmission);

        return new SubmitScanDataResponse(true, responseMessage);
    }

    // Hàm mới thay thế cho ValidateSessionAsync và DetermineCurrentRoundAsync
    private async Task<SubmissionDetails> DetermineSubmissionDetailsAsync(
        Guid sessionId,
        DateTime timestamp,
        CancellationToken cancellationToken)
    {
        // Bước 1: Tìm round phù hợp với timestamp
        var allRoundsInSession = await roundRepository.GetRoundsBySessionIdAsync(sessionId, cancellationToken);

        var targetRound = allRoundsInSession
            .Where(r => timestamp >= r.StartTime && timestamp <= r.EndTime)
            .OrderByDescending(r => r.StartTime)
            .FirstOrDefault();

        if (targetRound is null)
        {
            logger.LogWarning(
                "No suitable round found for Session {SessionId} at timestamp {Timestamp}",
                sessionId, timestamp);
            throw new ApplicationException("No suitable round found for the submission.");
        }

        // Bước 2: Xác định loại submission dựa trên trạng thái của round
        var isLateSubmission = Equals(targetRound.Status, RoundStatus.Completed) ||
                               Equals(targetRound.Status, RoundStatus.Finalized);

        logger.LogInformation(
            "Submission for Session {SessionId} assigned to Round {RoundId} " +
            "(Status: {Status}, IsLate: {IsLate})",
            sessionId, targetRound.Id, targetRound.Status.ToString(), isLateSubmission);

        return new SubmissionDetails(targetRound, isLateSubmission);
    }

    // Một hàm riêng để chỉ kiểm tra status của session
    private async Task ValidateSessionStatus(Guid sessionId, CancellationToken cancellationToken)
    {
        // Step 1: Check if session is actively running in Redis
        var sessionKey = $"session:{sessionId}";
        var sessionExists = await redisService.KeyExistsAsync(sessionKey);

        if (sessionExists)
        {
            logger.LogDebug("Session {SessionId} is active in Redis", sessionId);
            return;
        }

        logger.LogDebug("Session {SessionId} not found in Redis, checking database", sessionId);

        // Step 2: Session not in Redis - check database
        var session = await sessionRepository.GetByIdAsync(sessionId, cancellationToken);
        if (session is null)
        {
            logger.LogWarning("SubmitScanData failed: Session {SessionId} not found", sessionId);
            throw new BusinessRuleException(ErrorCodes.SessionNotFound, ErrorMessages.Attendance.SessionNotFound);
        }

        // Step 3: Handle different session statuses that should be rejected
        if (Equals(session.Status, SessionStatus.Cancelled))
            throw new BusinessRuleException(ErrorCodes.SessionCancelled, ErrorMessages.Attendance.SessionCancelled);

        if (Equals(session.Status, SessionStatus.Missed))
            throw new BusinessRuleException(ErrorCodes.SessionMissed, ErrorMessages.Attendance.SessionMissed);
    }
}

// Supporting classes
public record SubmissionDetails(Round Round, bool IsLateSubmission);