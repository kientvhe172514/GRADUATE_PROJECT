namespace Zentry.Modules.AttendanceManagement.Application.Dtos;

public class StudentSessionDto
{
    public Guid SessionId { get; set; }
    public int SessionNumber { get; set; }
    public string SessionName { get; set; }
    public DateOnly SessionDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public string RoomInfo { get; set; }
    public string AttendanceStatus { get; set; }
}