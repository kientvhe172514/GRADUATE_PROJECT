namespace Zentry.Modules.ScheduleManagement.Application.Dtos;

public class ClassSectionListItemDto
{
    public Guid Id { get; set; }
    public string SectionCode { get; set; } = string.Empty;
    public string Semester { get; set; } = string.Empty;

    public Guid CourseId { get; set; }
    public string? CourseCode { get; set; }
    public string? CourseName { get; set; }

    public Guid? LecturerId { get; set; }
    public string? LecturerFullName { get; set; }

    public int NumberOfStudents { get; set; }
}