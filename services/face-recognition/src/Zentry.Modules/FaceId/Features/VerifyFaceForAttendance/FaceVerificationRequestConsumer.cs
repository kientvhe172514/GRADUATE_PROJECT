using MassTransit;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Zentry.Modules.FaceId.Features.VerifyFaceForAttendance;

/// <summary>
/// Event received from Attendance Service when employee scans beacon
/// </summary>
public record FaceVerificationRequestedEvent
{
    public int EmployeeId { get; init; }
    public string EmployeeCode { get; init; } = string.Empty;
    public int AttendanceCheckId { get; init; }
    public string CheckType { get; init; } = string.Empty; // "check_in" or "check_out"
    public DateTime RequestTime { get; init; }
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
            // TODO: Get face image from mobile app (via SignalR or polling API)
            // For now, assume face image will be provided separately
            
            var command = new VerifyFaceForAttendanceCommand
            {
                AttendanceCheckId = evt.AttendanceCheckId,
                EmployeeId = evt.EmployeeId,
                EmployeeCode = evt.EmployeeCode,
                CheckType = evt.CheckType,
                RequestTime = evt.RequestTime
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
            
            // Publish failure event (simplified event structure)
            await context.Publish(new FaceVerificationCompletedEvent
            {
                EmployeeId = evt.EmployeeId,
                FaceVerified = false,
                FaceConfidence = 0,
                VerificationTime = DateTime.UtcNow,
                ErrorMessage = $"Face verification failed: {ex.Message}"
            });
        }
    }
}
