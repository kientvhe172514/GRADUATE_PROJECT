namespace Zentry.Modules.ScheduleManagement.Application.Dtos;

public class SessionDetailDto
{
    public Guid SessionId { get; set; }
    public int SessionNumber { get; set; }
    public string SessionName { get; set; } = string.Empty;
    public DateOnly SessionDate { get; set; }
    public TimeOnly SessionTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public string RoomInfo { get; set; } = string.Empty;
    public int AttendedCount { get; set; }
    public int TotalStudents { get; set; }
    public double AttendanceRate { get; set; }
    public string Status { get; set; } = string.Empty;
}