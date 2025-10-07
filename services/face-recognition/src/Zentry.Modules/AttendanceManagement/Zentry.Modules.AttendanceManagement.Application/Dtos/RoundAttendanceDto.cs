namespace Zentry.Modules.AttendanceManagement.Application.Dtos;

public class RoundAttendanceDto
{
    public Guid RoundId { get; set; }
    public Guid SessionId { get; set; }

    public int RoundNumber { get; set; }
    public int AttendedCount { get; set; }
    public int TotalStudents { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
}