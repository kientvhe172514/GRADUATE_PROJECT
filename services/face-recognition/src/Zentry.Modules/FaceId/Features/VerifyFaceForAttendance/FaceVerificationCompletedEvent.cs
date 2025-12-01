using System.Text.Json.Serialization;

namespace Zentry.Modules.FaceId.Features.VerifyFaceForAttendance;

/// <summary>
/// Event published to Attendance Service after face verification completes
/// Includes AttendanceCheckId so Attendance service can update the correct record
/// </summary>
public record FaceVerificationCompletedEvent
{
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
}
