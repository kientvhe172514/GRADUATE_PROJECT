using MassTransit;
using MediatR;
using Microsoft.Extensions.Logging;
using System.Text.Json.Serialization;

namespace Zentry.Modules.FaceId.Features.VerifyFaceForAttendance;

/// <summary>
/// NestJS RPC Message Envelope - ClientProxy.send() wraps data in this structure
/// Pattern: { "pattern": "...", "data": {...}, "id": "..." }
/// </summary>
public record NestJsRpcEnvelope
{
    [JsonPropertyName("pattern")]
    public string Pattern { get; init; } = string.Empty;
    
    [JsonPropertyName("data")]
    public FaceVerificationRpcRequest Data { get; init; } = new();
    
    [JsonPropertyName("id")]
    public string Id { get; init; } = string.Empty;
}

/// <summary>
/// RPC Request for face verification - ACTUAL data nested in NestJsRpcEnvelope.data
/// This is for NEW HR employee attendance system (NOT old school system)
/// ✅ Uses JsonPropertyName for explicit mapping from NestJS snake_case
/// </summary>
public record FaceVerificationRpcRequest
{
    [JsonPropertyName("employee_id")]
    public int EmployeeId { get; init; }
    
    [JsonPropertyName("employee_code")]
    public string EmployeeCode { get; init; } = string.Empty;
    
    [JsonPropertyName("attendance_check_id")]
    public int AttendanceCheckId { get; init; }
    
    [JsonPropertyName("shift_id")]
    public int ShiftId { get; init; }
    
    [JsonPropertyName("check_type")]
    public string CheckType { get; init; } = string.Empty; // "check_in" or "check_out"
    
    [JsonPropertyName("request_time")]
    public DateTime RequestTime { get; init; }
    
    [JsonPropertyName("face_embedding_base64")]
    public string? FaceEmbeddingBase64 { get; init; }
}

/// <summary>
/// Response returned synchronously to Attendance Service
/// ✅ Uses JsonPropertyName for explicit mapping to NestJS snake_case
/// </summary>
public record FaceVerificationRpcResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; init; }
    
    [JsonPropertyName("attendance_check_id")]
    public int AttendanceCheckId { get; init; }
    
    [JsonPropertyName("employee_id")]
    public int EmployeeId { get; init; }
    
    [JsonPropertyName("face_verified")]
    public bool FaceVerified { get; init; }
    
    [JsonPropertyName("face_confidence")]
    public double FaceConfidence { get; init; }
    
    [JsonPropertyName("verification_time")]
    public DateTime VerificationTime { get; init; }
    
    [JsonPropertyName("error_message")]
    public string? ErrorMessage { get; init; }
    
    [JsonPropertyName("message")]
    public string? Message { get; init; }
}

/// <summary>
/// RPC Consumer for SYNCHRONOUS face verification requests from Attendance Service
/// ✅ Consumes NestJsRpcEnvelope wrapper to match ClientProxy.send() structure
/// </summary>
public class FaceVerificationRpcConsumer : IConsumer<NestJsRpcEnvelope>
{
    private readonly IMediator _mediator;
    private readonly ILogger<FaceVerificationRpcConsumer> _logger;

    public FaceVerificationRpcConsumer(
        IMediator mediator,
        ILogger<FaceVerificationRpcConsumer> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<NestJsRpcEnvelope> context)
    {
        var envelope = context.Message;
        var request = envelope.Data; // Extract actual data from NestJS envelope
        
        // 🔍 DEBUG: Log raw message body to see what MassTransit actually received
        var rawBody = context.ReceiveContext.GetBody();
        var rawJson = System.Text.Encoding.UTF8.GetString(rawBody);
        _logger.LogInformation("🔍 [DEBUG] Raw message body: {RawJson}", rawJson);
        _logger.LogInformation("🔍 [DEBUG] Envelope Pattern: {Pattern}, ID: {Id}", envelope.Pattern, envelope.Id);
        
        _logger.LogInformation(
            "📨 [RPC] Received SYNC face verification request: AttendanceCheckId={AttendanceCheckId}, " +
            "EmployeeId={EmployeeId}, EmployeeCode={EmployeeCode}, CheckType={CheckType}",
            request.AttendanceCheckId, request.EmployeeId, request.EmployeeCode, request.CheckType);

        FaceVerificationRpcResponse response;
        
        try
        {
            var command = new VerifyFaceForAttendanceCommand
            {
                AttendanceCheckId = request.AttendanceCheckId,
                EmployeeId = request.EmployeeId,
                EmployeeCode = request.EmployeeCode,
                CheckType = request.CheckType,
                RequestTime = request.RequestTime,
                FaceEmbeddingBase64 = request.FaceEmbeddingBase64
            };

            var result = await _mediator.Send(command);
            
            response = new FaceVerificationRpcResponse
            {
                Success = result.Success,
                AttendanceCheckId = request.AttendanceCheckId,
                EmployeeId = request.EmployeeId,
                FaceVerified = result.FaceVerified,
                FaceConfidence = result.FaceConfidence,
                VerificationTime = DateTime.UtcNow,
                ErrorMessage = result.Success ? null : result.Message,
                Message = result.Message
            };
            
            _logger.LogInformation(
                "✅ [RPC] Face verification completed: AttendanceCheckId={AttendanceCheckId}, " +
                "FaceVerified={FaceVerified}, Confidence={Confidence:P1}",
                request.AttendanceCheckId, result.FaceVerified, result.FaceConfidence);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "❌ [RPC] Failed to process face verification: EmployeeId={EmployeeId}, AttendanceCheckId={AttendanceCheckId}",
                request.EmployeeId, request.AttendanceCheckId);
            
            response = new FaceVerificationRpcResponse
            {
                Success = false,
                AttendanceCheckId = request.AttendanceCheckId,
                EmployeeId = request.EmployeeId,
                FaceVerified = false,
                FaceConfidence = 0,
                VerificationTime = DateTime.UtcNow,
                ErrorMessage = $"Face verification error: {ex.Message}",
                Message = "Internal error during face verification"
            };
        }

        // ✅ Debug: Check reply-to address from incoming message
        var replyToAddress = context.ResponseAddress ?? context.SourceAddress;
        _logger.LogInformation(
            "🔍 [DEBUG] Response details: FaceVerified={FaceVerified}, Confidence={Confidence:P1}, " +
            "ReplyTo={ReplyTo}, CorrelationId={CorrelationId}",
            response.FaceVerified, response.FaceConfidence, 
            replyToAddress, context.RequestId ?? context.CorrelationId);

        // Send direct response (NestJS ClientProxy.send() expects plain object)
        // MassTransit RespondAsync will automatically use the reply-to queue from request headers
        await context.RespondAsync(response);
        
        _logger.LogInformation(
            "📤 [RPC] Response sent to Attendance Service for AttendanceCheckId={AttendanceCheckId}",
            request.AttendanceCheckId);
    }
}
