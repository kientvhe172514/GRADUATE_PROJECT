using MassTransit;
using MediatR;
using Microsoft.Extensions.Logging;
using System.Text.Json.Serialization;

namespace Zentry.Modules.FaceId.Features.VerifyFaceForAttendance;

/// <summary>
/// Event received from Attendance Service when employee scans beacon
/// </summary>
public record FaceVerificationRequestedEvent
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
    public string? FaceEmbeddingBase64 { get; init; } // 🆕 Face embedding for verification
}

/// <summary>
/// Consumer for face verification requests from Attendance Service
/// This is for NEW HR employee attendance system (NOT old school system)
/// </summary>
public class FaceVerificationRequestConsumer : IConsumer<FaceVerificationRequestedEvent>
{
    private readonly IMediator _mediator;
    private readonly ILogger<FaceVerificationRequestConsumer> _logger;

    public FaceVerificationRequestConsumer(
        IMediator mediator,
        ILogger<FaceVerificationRequestConsumer> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<FaceVerificationRequestedEvent> context)
    {
        var evt = context.Message;
        
        _logger.LogInformation(
            "📨 Received face verification request: AttendanceCheckId={AttendanceCheckId}, " +
            "EmployeeId={EmployeeId}, EmployeeCode={EmployeeCode}, CheckType={CheckType}",
            evt.AttendanceCheckId, evt.EmployeeId, evt.EmployeeCode, evt.CheckType);

        try
        {
            var command = new VerifyFaceForAttendanceCommand
            {
                AttendanceCheckId = evt.AttendanceCheckId,
                EmployeeId = evt.EmployeeId,
                EmployeeCode = evt.EmployeeCode,
                CheckType = evt.CheckType,
                RequestTime = evt.RequestTime,
                FaceEmbeddingBase64 = evt.FaceEmbeddingBase64 // 🆕 Pass face embedding
            };

            await _mediator.Send(command);
            
            _logger.LogInformation(
                "✅ Face verification processing completed for AttendanceCheckId={AttendanceCheckId}",
                evt.AttendanceCheckId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "❌ Failed to process face verification request for EmployeeId={EmployeeId} (AttendanceCheckId={AttendanceCheckId})",
                evt.EmployeeId, evt.AttendanceCheckId);
            
            // Publish failure event
            await context.Publish(new FaceVerificationCompletedEvent
            {
                AttendanceCheckId = evt.AttendanceCheckId,
                EmployeeId = evt.EmployeeId,
                FaceVerified = false,
                FaceConfidence = 0,
                VerificationTime = DateTime.UtcNow,
                ErrorMessage = $"Face verification failed: {ex.Message}"
            });
        }
    }
}
