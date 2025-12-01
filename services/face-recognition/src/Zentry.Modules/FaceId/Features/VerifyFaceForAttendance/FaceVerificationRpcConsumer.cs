using MassTransit;
using MediatR;
using Microsoft.Extensions.Logging;
using System.Text.Json.Serialization;

namespace Zentry.Modules.FaceId.Features.VerifyFaceForAttendance;

/// <summary>
/// RPC Request/Response model for synchronous face verification
/// This is for NEW HR employee attendance system (NOT old school system)
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
    public string Message { get; init; } = string.Empty;
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

        // Send response back to caller (Attendance Service)
        await context.RespondAsync(response);
        
        _logger.LogInformation(
            "📤 [RPC] Response sent to Attendance Service for AttendanceCheckId={AttendanceCheckId}",
            request.AttendanceCheckId);
    }
}
