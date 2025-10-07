namespace Zentry.Modules.ScheduleManagement.Application.Dtos;

public class NextSessionDto
{
    public Guid SessionId { get; set; }
    public Guid ClassSectionId { get; set; }
    public string ClassTitle { get; set; } = string.Empty;
    public string CourseCode { get; set; } = string.Empty;
    public string SectionCode { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public DateOnly EndDate { get; set; }
    public TimeOnly EndTime { get; set; }
    public string RoomInfo { get; set; } = string.Empty;
    public int EnrolledStudents { get; set; }
    public string? LecturerName { get; set; } = string.Empty;
    public string AttendanceStatus { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}