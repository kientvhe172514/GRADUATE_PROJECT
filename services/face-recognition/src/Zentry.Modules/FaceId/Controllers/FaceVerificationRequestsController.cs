using MassTransit;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Zentry.Infrastructure.Caching;
using Zentry.Modules.FaceId.Features.VerifyFaceId;
using Zentry.Modules.FaceId.Interfaces;
using Zentry.SharedKernel.Contracts.Events;
using Zentry.SharedKernel.Contracts.Schedule;

namespace Zentry.Modules.FaceId.Controllers;

[ApiController]
[Route("api/faceid/requests")]
public class FaceVerificationRequestsController : ControllerBase
{
    private readonly ILogger<FaceVerificationRequestsController> _logger;
    private readonly IMediator _mediator;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly IRedisService _redis;
    private readonly IFaceIdRepository _repository;

    public FaceVerificationRequestsController(
        ILogger<FaceVerificationRequestsController> logger,
        IMediator mediator,
        IPublishEndpoint publishEndpoint,
        IRedisService redis,
        IFaceIdRepository repository)
    {
        _logger = logger;
        _mediator = mediator;
        _publishEndpoint = publishEndpoint;
        _redis = redis;
        _repository = repository;
    }

    [HttpPost]
    [ProducesResponseType(typeof(CreateFaceVerificationResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CreateFaceVerificationRequestDto request,
        CancellationToken cancellationToken)
    {
        if (request.LecturerId == Guid.Empty)
            return BadRequest(new { Message = "LecturerId is required" });

        if (request.SessionId == Guid.Empty)
            return BadRequest(new { Message = "SessionId is required" });

        if ((request.ClassSectionId is null || request.ClassSectionId == Guid.Empty) &&
            (request.RecipientUserIds is null || request.RecipientUserIds.Count == 0))
            return BadRequest(new { Message = "Provide either ClassSectionId or RecipientUserIds" });

        try
        {
            // 1) Validate session exists and is active (basic validation)
            // Note: We can't check session status from other module, so we'll rely on the session ID being valid
            if (request.SessionId == Guid.Empty)
            {
                _logger.LogWarning("Invalid SessionId provided: {SessionId}", request.SessionId);
                return BadRequest(new { Message = "Invalid SessionId provided" });
            }

            // 2) Resolve recipients
            List<Guid> recipients;
            if (request.RecipientUserIds is not null && request.RecipientUserIds.Count > 0)
            {
                recipients = request.RecipientUserIds.Distinct().ToList();
                _logger.LogInformation(
                    "Using explicit recipient list with {RecipientCount} users for Session {SessionId}",
                    recipients.Count, request.SessionId);
            }
            else
            {
                var resp = await _mediator.Send(
                    new GetStudentIdsByClassSectionIdIntegrationQuery(request.ClassSectionId!.Value),
                    cancellationToken);
                recipients = resp.StudentIds.Distinct().ToList();
                _logger.LogInformation(
                    "Resolved {RecipientCount} recipients from ClassSection {ClassSectionId} for Session {SessionId}",
                    recipients.Count, request.ClassSectionId, request.SessionId);
            }

            if (recipients.Count == 0)
            {
                _logger.LogWarning("No recipients found for Session {SessionId}", request.SessionId);
                return BadRequest(new { Message = "No recipients found" });
            }

            // 3) Check if there are existing active requests for this session
            var existingRequests =
                await _repository.GetActiveVerifyRequestsBySessionAsync(request.SessionId, cancellationToken);
            if (existingRequests.Any())
            {
                _logger.LogWarning("Session {SessionId} already has {ExistingCount} active verification requests",
                    request.SessionId, existingRequests.Count);
                return Conflict(new { Message = "Session already has active verification requests" });
            }

            // 4) Build request meta and store to redis
            var requestId = Guid.NewGuid();
            var now = DateTime.UtcNow;
            var expiresInMinutes =
                Math.Max(1, Math.Min(request.ExpiresInMinutes.GetValueOrDefault(30), 120)); // Max 2 hours
            var expiresAt = now.AddMinutes(expiresInMinutes);
            var threshold = 0.5f;

            var meta = new FaceVerificationRequestMeta(
                requestId,
                request.SessionId,
                request.LecturerId,
                request.ClassSectionId,
                expiresAt,
                request.Title,
                request.Body,
                recipients);

            var metaKey = $"faceid:req:{requestId}:meta";
            await _redis.SetAsync(metaKey, meta, expiresAt - now);

            // 5) Persist requests (one per recipient) to DB for auditing/expiry
            foreach (var uid in recipients)
                await _mediator.Send(
                    new PersistVerifyRequestCommand(requestId, uid, request.LecturerId, request.SessionId,
                        request.ClassSectionId, threshold, expiresAt), cancellationToken);

            // 6) Push notifications
            var title = string.IsNullOrWhiteSpace(request.Title) ? "Yêu cầu xác thực Face ID" : request.Title!;
            var body = string.IsNullOrWhiteSpace(request.Body)
                ? "Vui lòng xác thực khuôn mặt để tiếp tục."
                : request.Body!;
            var deeplink = $"zentry://face-verify?requestId={requestId}&sessionId={request.SessionId}";

            // ✅ Thêm: Lưu NotificationId vào database
            var notificationIds = new List<string>();
            var publishTasks = recipients.Select(async userId =>
            {
                var notificationId = Guid.NewGuid().ToString();
                notificationIds.Add(notificationId);

                var notificationEvent = new NotificationCreatedEvent
                {
                    Title = title,
                    Body = body,
                    RecipientUserId = userId,
                    Type = NotificationType.All,
                    Data = new Dictionary<string, string>
                    {
                        ["type"] = "FACE_VERIFICATION_REQUEST",
                        ["requestId"] = requestId.ToString(),
                        ["sessionId"] = request.SessionId.ToString(),
                        ["deeplink"] = deeplink,
                        ["action"] = "VERIFY_FACE",
                        ["expiresAt"] = expiresAt.ToString("O"),
                        ["notificationId"] = notificationId
                    }
                };

                await _publishEndpoint.Publish(notificationEvent, cancellationToken);
                return notificationId;
            });

            var publishedNotificationIds = await Task.WhenAll(publishTasks);

            // ✅ Thêm: Cập nhật NotificationId cho tất cả records
            foreach (var uid in recipients)
            {
                var notificationId = publishedNotificationIds[recipients.IndexOf(uid)];
                await _mediator.Send(new UpdateNotificationIdCommand(requestId, uid, notificationId),
                    cancellationToken);
            }

            _logger.LogInformation(
                "Face verification request {RequestId} created successfully for Session {SessionId} with {RecipientCount} recipients, expires at {ExpiresAt}",
                requestId, request.SessionId, recipients.Count, expiresAt);

            return CreatedAtAction(nameof(GetStatus), new { requestId }, new CreateFaceVerificationResponseDto
            {
                RequestId = requestId,
                SessionId = request.SessionId,
                ExpiresAt = expiresAt,
                TotalRecipients = recipients.Count,
                Threshold = threshold
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create face verification request for Session {SessionId}",
                request.SessionId);
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { Message = "Internal server error occurred" });
        }
    }

    [HttpPost("{requestId:guid}/verify")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status410Gone)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Verify(
        Guid requestId,
        [FromForm] string userId,
        IFormFile embedding,
        [FromForm] float? threshold,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(userId))
            return BadRequest(new { Message = "userId is required" });
        if (embedding is null)
            return BadRequest(new { Message = "embedding file is required" });

        try
        {
            // 1) Get and validate request meta
            var metaKey = $"faceid:req:{requestId}:meta";
            var meta = await _redis.GetAsync<FaceVerificationRequestMeta>(metaKey);
            if (meta is null)
            {
                _logger.LogWarning("Verify request {RequestId} not found in Redis", requestId);
                return NotFound(new { Message = "Request not found or expired" });
            }

            // 2) Check if request has expired
            if (DateTime.UtcNow > meta.ExpiresAt)
            {
                _logger.LogWarning("Verify request {RequestId} has expired at {ExpiresAt}", requestId, meta.ExpiresAt);

                // Cleanup expired request from Redis
                await _redis.RemoveAsync(metaKey);
                await _redis.RemoveAsync($"faceid:req:{requestId}:verified");

                return StatusCode(StatusCodes.Status410Gone, new { Message = "Request expired" });
            }

            // 3) Validate user is recipient
            var parsedUserId = Guid.Parse(userId);
            if (!meta.Recipients.Contains(parsedUserId))
            {
                _logger.LogWarning("User {UserId} is not a recipient of request {RequestId}", parsedUserId, requestId);
                return BadRequest(new { Message = "User is not a recipient of this request" });
            }

            // 4) Check if user has already verified for this request
            var verifiedKey = $"faceid:req:{requestId}:verified";
            var verified = await _redis.GetAsync<List<Guid>>(verifiedKey) ?? new List<Guid>();
            if (verified.Contains(parsedUserId))
            {
                _logger.LogInformation("User {UserId} has already verified for request {RequestId}", parsedUserId,
                    requestId);
                return Conflict(new { Message = "User has already verified for this request" });
            }

            // 5) Process embedding file
            using var memoryStream = new MemoryStream();
            await embedding.CopyToAsync(memoryStream, cancellationToken);
            var embeddingBytes = memoryStream.ToArray();

            if (embeddingBytes.Length == 0)
            {
                _logger.LogWarning("Empty embedding file provided for request {RequestId}", requestId);
                return BadRequest(new { Message = "Empty embedding file provided" });
            }

            var embeddingArray = new float[embeddingBytes.Length / 4];
            Buffer.BlockCopy(embeddingBytes, 0, embeddingArray, 0, embeddingBytes.Length);

            // 6) Verify via FaceId module handler
            var cmd = new VerifyFaceIdCommand(parsedUserId, embeddingArray, threshold ?? 0.5f, requestId);
            var result = await _mediator.Send(cmd, cancellationToken);

            // 7) Store receipt for auditing
            var ttl = meta.ExpiresAt - DateTime.UtcNow;
            if (ttl < TimeSpan.Zero) ttl = TimeSpan.FromSeconds(1);

            var receipt = new FaceVerificationReceipt(
                requestId,
                parsedUserId,
                result.Success,
                result.Similarity,
                DateTime.UtcNow);

            var userKey = $"faceid:req:{requestId}:user:{parsedUserId}";
            await _redis.SetAsync(userKey, receipt, ttl);

            // 8) Update verification status
            if (result.Success)
            {
                // Add to verified list
                if (!verified.Contains(parsedUserId))
                {
                    verified.Add(parsedUserId);
                    await _redis.SetAsync(verifiedKey, verified, ttl);
                }

                // ✅ Sửa: Truyền đúng thứ tự parameter mới
                await _mediator.Send(new CompleteVerifyRequestCommand(
                        parsedUserId, // TargetUserId
                        meta.SessionId, // SessionId  
                        requestId, // RequestGroupId (đây là requestId từ controller)
                        true, // Matched
                        result.Similarity), // Similarity
                    cancellationToken);

                _logger.LogInformation(
                    "User {UserId} successfully verified for request {RequestId} with similarity {Similarity}",
                    parsedUserId, requestId, result.Similarity);
            }
            else
            {
                // Record failed attempt
                // ✅ Sửa: Truyền đúng thứ tự parameter mới
                await _mediator.Send(new CompleteVerifyRequestCommand(
                        parsedUserId, // TargetUserId
                        meta.SessionId, // SessionId  
                        requestId, // RequestGroupId (đây là requestId từ controller)
                        false, // Matched
                        result.Similarity, // Similarity
                        true), // completeIfFailed
                    cancellationToken);

                _logger.LogInformation(
                    "User {UserId} failed verification for request {RequestId} with similarity {Similarity}",
                    parsedUserId, requestId, result.Similarity);
            }

            return Ok(new
            {
                result.Success,
                result.Similarity,
                receipt.VerifiedAt,
                RequestId = requestId,
                meta.SessionId
            });
        }
        catch (FormatException)
        {
            _logger.LogWarning("Invalid userId format provided: {UserId}", userId);
            return BadRequest(new { Message = "Invalid userId format" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during verification for request {RequestId}", requestId);
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { Message = "Internal server error occurred" });
        }
    }

    [HttpGet("{requestId:guid}/status")]
    [ProducesResponseType(typeof(FaceVerificationStatusResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetStatus(Guid requestId)
    {
        var metaKey = $"faceid:req:{requestId}:meta";
        var meta = await _redis.GetAsync<FaceVerificationRequestMeta>(metaKey);
        if (meta is null)
            return NotFound(new { Message = "Request not found or expired" });

        var verifiedKey = $"faceid:req:{requestId}:verified";
        var verified = await _redis.GetAsync<List<Guid>>(verifiedKey) ?? new List<Guid>();

        var response = new FaceVerificationStatusResponse
        {
            RequestId = meta.RequestId,
            SessionId = meta.SessionId,
            ExpiresAt = meta.ExpiresAt,
            TotalRecipients = meta.Recipients.Count,
            TotalVerified = verified.Count,
            VerifiedUserIds = verified
        };

        return Ok(response);
    }

    [HttpPatch("{requestId:guid}/cancel")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Cancel(Guid requestId, CancellationToken cancellationToken)
    {
        try
        {
            var metaKey = $"faceid:req:{requestId}:meta";
            var meta = await _redis.GetAsync<FaceVerificationRequestMeta>(metaKey);
            if (meta is null)
            {
                _logger.LogWarning("Cancel request {RequestId} not found in Redis", requestId);
                return NotFound(new { Message = "Request not found or expired" });
            }

            // Check if request has already expired
            if (DateTime.UtcNow > meta.ExpiresAt)
            {
                _logger.LogInformation("Request {RequestId} has already expired, cleaning up", requestId);
                await CleanupExpiredRequest(requestId);
                return NoContent();
            }

            _logger.LogInformation(
                "Canceling face verification request {RequestId} for Session {SessionId} with {RecipientCount} recipients",
                requestId, meta.SessionId, meta.Recipients.Count);

            // 1) Notify recipients that the verification session ended early
            var title = "Phiên xác thực kết thúc";
            var body = "Giảng viên đã kết thúc phiên học sớm. Bạn không cần xác thực nữa.";
            var publishTasks = meta.Recipients.Select(userId => _publishEndpoint.Publish(new NotificationCreatedEvent
            {
                Title = title,
                Body = body,
                RecipientUserId = userId,
                Type = NotificationType.All,
                Data = new Dictionary<string, string>
                {
                    ["type"] = "FACE_VERIFICATION_CANCELED",
                    ["requestId"] = requestId.ToString(),
                    ["sessionId"] = meta.SessionId.ToString(),
                    ["action"] = "CLOSE_VERIFY",
                    ["canceledAt"] = DateTime.UtcNow.ToString("O")
                }
            }, cancellationToken));
            await Task.WhenAll(publishTasks);

            // 2) Cancel all pending verify requests in database
            await _repository.CancelVerifyRequestsByGroupAsync(requestId, cancellationToken);

            // 3) Cleanup Redis keys
            await CleanupRequestFromRedis(requestId);

            _logger.LogInformation("Face verification request {RequestId} canceled successfully", requestId);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error canceling face verification request {RequestId}", requestId);
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { Message = "Internal server error occurred" });
        }
    }

    [HttpPatch("sessions/{sessionId:guid}/cleanup")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CleanupSessionRequests(Guid sessionId, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Cleaning up all face verification requests for Session {SessionId}", sessionId);

            // 1) Get all active requests for this session
            var activeRequests = await _repository.GetActiveVerifyRequestsBySessionAsync(sessionId, cancellationToken);
            if (!activeRequests.Any())
            {
                _logger.LogInformation("No active face verification requests found for Session {SessionId}", sessionId);
                return NoContent();
            }

            // 2) Cancel all pending requests in database
            await _repository.CancelVerifyRequestsBySessionAsync(sessionId, cancellationToken);

            // 3) Cleanup Redis keys for all requests
            foreach (var request in activeRequests) await CleanupRequestFromRedis(request.RequestGroupId);

            // 4) Notify all recipients that verification session ended
            var uniqueRecipients = activeRequests.Select(r => r.TargetUserId).Distinct().ToList();
            var title = "Phiên xác thực kết thúc";
            var body = "Phiên học đã kết thúc. Bạn không cần xác thực nữa.";

            var publishTasks = uniqueRecipients.Select(userId => _publishEndpoint.Publish(new NotificationCreatedEvent
            {
                Title = title,
                Body = body,
                RecipientUserId = userId,
                Type = NotificationType.All,
                Data = new Dictionary<string, string>
                {
                    ["type"] = "SESSION_VERIFICATION_CLEANUP",
                    ["sessionId"] = sessionId.ToString(),
                    ["action"] = "CLOSE_VERIFY",
                    ["cleanedAt"] = DateTime.UtcNow.ToString("O")
                }
            }, cancellationToken));
            await Task.WhenAll(publishTasks);

            _logger.LogInformation("Cleaned up {RequestCount} face verification requests for Session {SessionId}",
                activeRequests.Count, sessionId);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cleaning up face verification requests for Session {SessionId}", sessionId);
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { Message = "Internal server error occurred" });
        }
    }

    private async Task CleanupExpiredRequest(Guid requestId)
    {
        try
        {
            await CleanupRequestFromRedis(requestId);
            _logger.LogDebug("Cleaned up expired request {RequestId} from Redis", requestId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to cleanup expired request {RequestId} from Redis", requestId);
        }
    }

    private async Task CleanupRequestFromRedis(Guid requestId)
    {
        var keysToRemove = new[]
        {
            $"faceid:req:{requestId}:meta",
            $"faceid:req:{requestId}:verified"
        };

        foreach (var key in keysToRemove) await _redis.RemoveAsync(key);
    }

    public class CreateFaceVerificationRequestDto
    {
        public Guid LecturerId { get; set; }
        public Guid SessionId { get; set; }
        public Guid? ClassSectionId { get; set; }
        public List<Guid>? RecipientUserIds { get; set; }
        public int? ExpiresInMinutes { get; set; }
        public string? Title { get; set; }
        public string? Body { get; set; }
    }

    public class CreateFaceVerificationResponseDto
    {
        public required Guid RequestId { get; init; }
        public required Guid SessionId { get; init; }
        public required DateTime ExpiresAt { get; init; }
        public required int TotalRecipients { get; init; }
        public required float Threshold { get; init; }
    }

    private record FaceVerificationRequestMeta(
        Guid RequestId,
        Guid SessionId,
        Guid LecturerId,
        Guid? ClassSectionId,
        DateTime ExpiresAt,
        string? Title,
        string? Body,
        List<Guid> Recipients
    );

    private record FaceVerificationReceipt(
        Guid RequestId,
        Guid UserId,
        bool Success,
        float Similarity,
        DateTime VerifiedAt
    );

    public class FaceVerificationStatusResponse
    {
        public required Guid RequestId { get; init; }
        public required Guid SessionId { get; init; }
        public required DateTime ExpiresAt { get; init; }
        public required int TotalRecipients { get; init; }
        public required int TotalVerified { get; init; }
        public required List<Guid> VerifiedUserIds { get; init; }
    }
}