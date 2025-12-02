using MassTransit;
using MediatR;
using Microsoft.Extensions.Logging;
using System.Text.Json.Serialization;

namespace Zentry.Modules.FaceId.Features.VerifyFaceForAttendance;

/// <summary>
/// RPC Request/Response model for synchronous face verification
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
/// </summary>
public record FaceVerificationRpcResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; init; }
    
    [JsonPropertyName("attendance_check_id")]
    public int AttendanceCheckId { get; init; }
    
    // ✅ Use snake_case property names directly (Raw JSON Serializer requirement)
    public bool success { get; init; }
    public int attendance_check_id { get; init; }
    public int employee_id { get; init; }
    public bool face_verified { get; init; }
    public double face_confidence { get; init; }
    public DateTime verification_time { get; init; }
    public string? error_message { get; init; }
    public string? message { get; init; }
}

/// <summary>
/// RPC Consumer for SYNCHRONOUS face verification requests from Attendance Service
/// Replaces async event-based consumer for immediate response
/// </summary>
public class FaceVerificationRpcConsumer : IConsumer<FaceVerificationRpcRequest>
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

    public async Task Consume(ConsumeContext<FaceVerificationRpcRequest> context)
    {
        var request = context.Message;
        
        // 🔍 DEBUG: Log raw message body to see what MassTransit actually received
        var rawBody = context.ReceiveContext.GetBody();
        var rawJson = System.Text.Encoding.UTF8.GetString(rawBody);
        _logger.LogInformation("🔍 [DEBUG] Raw message body: {RawJson}", rawJson);
        
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
                success = result.Success,
                attendance_check_id = request.AttendanceCheckId,
                employee_id = request.EmployeeId,
                face_verified = result.FaceVerified,
                face_confidence = result.FaceConfidence,
                verification_time = DateTime.UtcNow,
                error_message = result.Success ? null : result.Message,
                message = result.Message
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
                success = false,
                attendance_check_id = request.AttendanceCheckId,
                employee_id = request.EmployeeId,
                face_verified = false,
                face_confidence = 0,
                verification_time = DateTime.UtcNow,
                error_message = $"Face verification error: {ex.Message}",
                message = "Internal error during face verification"
            };
        }

        // Send response back to caller (Attendance Service)
        await context.RespondAsync(response);
        
        _logger.LogInformation(
            "📤 [RPC] Response sent to Attendance Service for AttendanceCheckId={AttendanceCheckId}",
            request.AttendanceCheckId);
    }
}
