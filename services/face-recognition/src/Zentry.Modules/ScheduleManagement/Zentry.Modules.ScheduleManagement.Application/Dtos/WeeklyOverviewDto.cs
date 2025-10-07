namespace Zentry.Modules.ScheduleManagement.Application.Dtos;

public class WeeklyOverviewDto
{
    public Guid ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public string CourseCode { get; set; } = string.Empty;
    public string SectionCode { get; set; } = string.Empty;
    public int EnrolledStudents { get; set; }
    public int TotalSessions { get; set; }
    public int CurrentSession { get; set; }
    public int SessionsThisWeek { get; set; }
    public int CompletedSessionsThisWeek { get; set; }
    public double AttendanceRate { get; set; }
    public WeekProgressDto WeekProgress { get; set; } = new();
}