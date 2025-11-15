using MediatR;

namespace Zentry.Modules.FaceId.Features.VerifyFaceForAttendance;

/// <summary>
/// Command to verify employee face for attendance check
/// </summary>
public record VerifyFaceForAttendanceCommand : IRequest<VerifyFaceForAttendanceResult>
{
    public int AttendanceCheckId { get; init; }
    public int EmployeeId { get; init; }
    public string EmployeeCode { get; init; } = string.Empty;
    public string CheckType { get; init; } = string.Empty;
    public DateTime RequestTime { get; init; }
    
    // Face image will be provided via separate API call
    public byte[]? FaceImageData { get; init; }
}

public record VerifyFaceForAttendanceResult
{
    public bool Success { get; init; }
    public bool FaceVerified { get; init; }
    public double FaceConfidence { get; init; }
    public string Message { get; init; } = string.Empty;
}
