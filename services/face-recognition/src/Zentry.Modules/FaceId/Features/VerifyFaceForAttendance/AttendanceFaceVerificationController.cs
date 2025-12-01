using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Zentry.Modules.FaceId.Features.VerifyFaceForAttendance;

[ApiController]
[Route("api/face-id/attendance")]
public class AttendanceFaceVerificationController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<AttendanceFaceVerificationController> _logger;

    public AttendanceFaceVerificationController(
        IMediator mediator,
        ILogger<AttendanceFaceVerificationController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// [DEPRECATED] This HTTP endpoint is replaced by RabbitMQ event-driven flow.
    /// Face embeddings are now sent via Attendance Service → RabbitMQ → Face Service.
    /// Keep this endpoint for backward compatibility only.
    /// </summary>
    [Obsolete("Use RabbitMQ event 'face_verification_requested' instead")]
    [HttpPost("verify")]
    [ProducesResponseType(typeof(VerifyFaceForAttendanceResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult VerifyFaceForAttendance()
    {
        _logger.LogWarning("⚠️ DEPRECATED ENDPOINT called: POST /api/face-id/attendance/verify");
        
        return BadRequest(new 
        { 
            message = "This endpoint is deprecated. Use event-driven flow: " +
                     "Client → Attendance Service → RabbitMQ → Face Service",
            deprecated_since = "2024-12-01"
        });
    }
}
