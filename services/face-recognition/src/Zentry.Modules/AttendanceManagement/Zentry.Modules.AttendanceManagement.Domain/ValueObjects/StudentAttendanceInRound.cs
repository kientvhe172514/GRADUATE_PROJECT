namespace Zentry.Modules.AttendanceManagement.Domain.ValueObjects;

public class StudentAttendanceInRound
{
    public Guid StudentId { get; set; }
    public string? StudentCode { get; set; }
    public string DeviceId { get; set; }
    public bool IsAttended { get; set; }
    public DateTime? AttendedTime { get; set; }
}