namespace Zentry.Modules.AttendanceManagement.Application.Dtos;

public class SessionInfoDto
{
    public Guid SessionId { get; set; }
    public int SessionNumber { get; set; }
    public string? SessionName { get; set; }
    public string? Status { get; set; }
    public DateOnly SessionDate { get; set; }
    public TimeOnly SessionTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public string? RoomInfo { get; set; }
    public int AttendedCount { get; set; }
    public int TotalStudents { get; set; }
    public Guid? ClassSectionId { get; set; }
}