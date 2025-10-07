namespace Zentry.Modules.ScheduleManagement.Application.Dtos;

public class StudentClassDto
{
    public Guid ClassId { get; set; }
    public string? CourseName { get; set; }
    public string? CourseCode { get; set; }
    public string? SectionCode { get; set; }
    public string? ClassName { get; set; }
    public string? LecturerName { get; set; }
    public Guid? LecturerId { get; set; }
    public double AttendanceRate { get; set; }
}