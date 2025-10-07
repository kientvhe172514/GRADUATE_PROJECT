namespace Zentry.Modules.ScheduleManagement.Application.Dtos;

public class EnrollmentDto
{
    public Guid EnrollmentId { get; set; }
    public DateTime EnrollmentDate { get; set; }
    public Guid StudentId { get; set; }
    public string? StudentName { get; set; }

    public Guid ClassSectionId { get; set; }
    public string? ClassSectionCode { get; set; }
    public string? ClassSectionSemester { get; set; }

    public Guid? CourseId { get; set; }
    public string? CourseCode { get; set; }
    public string? CourseName { get; set; }

    public Guid? LecturerId { get; set; }
    public string? LecturerName { get; set; }

    public string? Status { get; set; }
}