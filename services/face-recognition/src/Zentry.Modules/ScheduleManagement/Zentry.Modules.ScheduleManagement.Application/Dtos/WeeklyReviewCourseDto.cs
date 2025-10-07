namespace Zentry.Modules.ScheduleManagement.Application.Dtos;

public class WeeklyReviewCourseDto
{
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public string SectionCode { get; set; } = string.Empty;
    public int TotalSessionsInWeek { get; set; }
    public int AttendedSessions { get; set; }
    public double AttendancePercentage { get; set; }
}