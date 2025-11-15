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
    /// Mobile app calls this endpoint to upload face image for verification
    /// Called AFTER beacon validation completes
    /// </summary>
    [HttpPost("verify")]
    [ProducesResponseType(typeof(VerifyFaceForAttendanceResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyFaceForAttendance(
        [FromForm] VerifyFaceForAttendanceRequest request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "📸 Received face image upload for AttendanceCheckId={AttendanceCheckId}, EmployeeId={EmployeeId}",
            request.AttendanceCheckId, request.EmployeeId);

        if (request.FaceImage == null || request.FaceImage.Length == 0)
        {
            return BadRequest(new { message = "Face image is required" });
        }

        // Read image data
        byte[] imageData;
        using (var ms = new MemoryStream())
        {
            await request.FaceImage.CopyToAsync(ms, cancellationToken);
            imageData = ms.ToArray();
        }

        var command = new VerifyFaceForAttendanceCommand
        {
            AttendanceCheckId = request.AttendanceCheckId,
            EmployeeId = request.EmployeeId,
            EmployeeCode = request.EmployeeCode,
            CheckType = request.CheckType,
            RequestTime = DateTime.UtcNow,
            FaceImageData = imageData
        };

        var result = await _mediator.Send(command, cancellationToken);

        return Ok(result);
    }
}

public record VerifyFaceForAttendanceRequest
{
    public int AttendanceCheckId { get; init; }
    public int EmployeeId { get; init; }
    public string EmployeeCode { get; init; } = string.Empty;
    public string CheckType { get; init; } = string.Empty;
    public IFormFile FaceImage { get; init; } = null!;
}
