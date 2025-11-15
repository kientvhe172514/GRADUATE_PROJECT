using MassTransit;
using MediatR;
using Microsoft.Extensions.Logging;
using Zentry.Modules.FaceId.Interfaces;

namespace Zentry.Modules.FaceId.Features.VerifyFaceForAttendance;

public class VerifyFaceForAttendanceCommandHandler 
    : IRequestHandler<VerifyFaceForAttendanceCommand, VerifyFaceForAttendanceResult>
{
    private readonly IFaceIdRepository _faceIdRepository;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<VerifyFaceForAttendanceCommandHandler> _logger;
    private const double MIN_CONFIDENCE_THRESHOLD = 0.85;

    public VerifyFaceForAttendanceCommandHandler(
        IFaceIdRepository faceIdRepository,
        IPublishEndpoint publishEndpoint,
        ILogger<VerifyFaceForAttendanceCommandHandler> logger)
    {
        _faceIdRepository = faceIdRepository;
        _publishEndpoint = publishEndpoint;
        _logger = logger;
    }

    public async Task<VerifyFaceForAttendanceResult> Handle(
        VerifyFaceForAttendanceCommand command,
        CancellationToken cancellationToken)
    {
        try
        {
            // Check if employee has registered face ID
            var exists = await _faceIdRepository.ExistsByUserIdAsync(command.EmployeeId, cancellationToken);
            
            if (!exists)
            {
                _logger.LogWarning(
                    "Employee {EmployeeCode} (ID={EmployeeId}) does not have registered Face ID",
                    command.EmployeeCode, command.EmployeeId);

                await PublishFailureEvent(command, 0, "Employee does not have registered Face ID");
                
                return new VerifyFaceForAttendanceResult
                {
                    Success = false,
                    FaceVerified = false,
                    FaceConfidence = 0,
                    Message = "Employee does not have registered Face ID"
                };
            }

            // TODO: Get face image from mobile app
            // For now, return pending status - mobile app will call separate API
            if (command.FaceImageData == null || command.FaceImageData.Length == 0)
            {
                _logger.LogInformation(
                    "Awaiting face image from employee {EmployeeCode} for AttendanceCheckId={AttendanceCheckId}",
                    command.EmployeeCode, command.AttendanceCheckId);

                // Don't publish event yet - wait for face image upload
                return new VerifyFaceForAttendanceResult
                {
                    Success = true,
                    FaceVerified = false,
                    FaceConfidence = 0,
                    Message = "Awaiting face image upload from mobile app"
                };
            }

            // TODO: Convert face image to embedding using ML model
            // This requires integration with Python ML service or local model
            // float[] embedding = await ConvertImageToEmbedding(command.FaceImageData, cancellationToken);
            
            // For now, simulate verification (TEMPORARY - MUST IMPLEMENT REAL VERIFICATION)
            _logger.LogWarning(
                "⚠️ TEMPORARY: Face verification not fully implemented. Using mock verification for EmployeeId={EmployeeId}",
                command.EmployeeId);

            // Mock verification - REPLACE WITH REAL IMPLEMENTATION
            var (isMatch, similarity) = (true, 0.92); // Mock high confidence match
            
            /* REAL IMPLEMENTATION (when ML integration ready):
            var (isMatch, similarity) = await _faceIdRepository.VerifyAsync(
                command.EmployeeId,
                embedding,
                MIN_CONFIDENCE_THRESHOLD,
                cancellationToken);
            */

            // Publish result event to Attendance Service
            await PublishSuccessEvent(command, similarity, isMatch);

            return new VerifyFaceForAttendanceResult
            {
                Success = true,
                FaceVerified = isMatch,
                FaceConfidence = similarity,
                Message = isMatch 
                    ? $"Face verified successfully with {similarity:P1} confidence" 
                    : $"Face verification failed - confidence {similarity:P1} below threshold"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "❌ Error verifying face for AttendanceCheckId={AttendanceCheckId}, EmployeeId={EmployeeId}",
                command.AttendanceCheckId, command.EmployeeId);

            await PublishFailureEvent(command, 0, $"Verification error: {ex.Message}");

            return new VerifyFaceForAttendanceResult
            {
                Success = false,
                FaceVerified = false,
                FaceConfidence = 0,
                Message = $"Face verification error: {ex.Message}"
            };
        }
    }

    private async Task PublishSuccessEvent(
        VerifyFaceForAttendanceCommand command,
        double confidence,
        bool verified)
    {
        var evt = new FaceVerificationCompletedEvent
        {
            AttendanceCheckId = command.AttendanceCheckId,
            EmployeeId = command.EmployeeId,
            EmployeeCode = command.EmployeeCode,
            FaceVerified = verified,
            FaceConfidence = confidence,
            VerificationTime = DateTime.UtcNow,
            ErrorMessage = null
        };

        await _publishEndpoint.Publish(evt);
        
        _logger.LogInformation(
            "📤 Published face_verification_completed event: AttendanceCheckId={AttendanceCheckId}, " +
            "Verified={Verified}, Confidence={Confidence:P1}",
            command.AttendanceCheckId, verified, confidence);
    }

    private async Task PublishFailureEvent(
        VerifyFaceForAttendanceCommand command,
        double confidence,
        string errorMessage)
    {
        var evt = new FaceVerificationCompletedEvent
        {
            AttendanceCheckId = command.AttendanceCheckId,
            EmployeeId = command.EmployeeId,
            EmployeeCode = command.EmployeeCode,
            FaceVerified = false,
            FaceConfidence = confidence,
            VerificationTime = DateTime.UtcNow,
            ErrorMessage = errorMessage
        };

        await _publishEndpoint.Publish(evt);
        
        _logger.LogWarning(
            "📤 Published face_verification_completed (FAILURE) event: AttendanceCheckId={AttendanceCheckId}, " +
            "Error={Error}",
            command.AttendanceCheckId, errorMessage);
    }
}
