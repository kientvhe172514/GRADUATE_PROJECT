namespace Zentry.Modules.FaceId.Features.VerifyFaceForAttendance;

/// <summary>
/// Event published to Attendance Service after face verification completes
/// Simplified: No need AttendanceCheckId or EmployeeCode, only EmployeeId
/// </summary>
public record FaceVerificationCompletedEvent
{
    public int EmployeeId { get; init; }
    public bool FaceVerified { get; init; }
    public double FaceConfidence { get; init; }
    public DateTime VerificationTime { get; init; }
    public string? ErrorMessage { get; init; }
}
