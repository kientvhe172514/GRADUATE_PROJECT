namespace Zentry.Modules.ScheduleManagement.Application.Dtos;

public class ClassSectionDto
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public string? CourseCode { get; set; }
    public string? CourseName { get; set; }
    public Guid? LecturerId { get; set; }
    public string? LecturerCode { get; set; }
    public string? LecturerFullName { get; set; }
    public string? LecturerEmail { get; set; }
    public string SectionCode { get; set; }
    public string Semester { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public List<ScheduleDto>? Schedules { get; set; }
    public List<EnrollmentDto>? Enrollments { get; set; }
}