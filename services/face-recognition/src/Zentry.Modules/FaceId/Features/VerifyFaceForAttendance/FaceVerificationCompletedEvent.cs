namespace Zentry.Modules.FaceId.Features.VerifyFaceForAttendance;

/// <summary>
/// Event published to Attendance Service after face verification completes
/// </summary>
public record FaceVerificationCompletedEvent
{
    public int AttendanceCheckId { get; init; }
    public int EmployeeId { get; init; }
    public string EmployeeCode { get; init; } = string.Empty;
    public bool FaceVerified { get; init; }
    public double FaceConfidence { get; init; }
    public DateTime VerificationTime { get; init; }
    public string? ErrorMessage { get; init; }
}
