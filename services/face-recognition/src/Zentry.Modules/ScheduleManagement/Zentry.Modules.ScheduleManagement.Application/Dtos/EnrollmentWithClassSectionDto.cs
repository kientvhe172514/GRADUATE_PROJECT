namespace Zentry.Modules.ScheduleManagement.Application.Dtos;

public class EnrollmentWithClassSectionDto
{
    public Guid ClassSectionId { get; set; }
    public Guid CourseId { get; set; }
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public string SectionCode { get; set; } = string.Empty;
    public Guid? LecturerId { get; set; }
}