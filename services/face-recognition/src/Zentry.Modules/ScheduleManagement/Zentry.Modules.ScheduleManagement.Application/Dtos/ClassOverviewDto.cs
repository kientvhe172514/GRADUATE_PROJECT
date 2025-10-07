namespace Zentry.Modules.ScheduleManagement.Application.Dtos;

public class ClassOverviewDto
{
    public Guid ClassId { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public string CourseCode { get; set; } = string.Empty;
    public string SectionCode { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public int EnrolledStudents { get; set; }
    public int CompletedSessions { get; set; }
    public int TotalSessions { get; set; }
    public double AttendanceRate { get; set; }
    public string? LecturerName { get; set; }
    public Guid? LecturerId { get; set; }
    public List<string> RoomInfos { get; set; } = [];
    public string? SemesterInfo { get; set; }
}