namespace Zentry.Modules.ScheduleManagement.Application.Features.Enrollments.EnrollStudent;

public class EnrollStudentRequest
{
    public Guid ClassSectionId { get; set; }
    public Guid StudentId { get; set; }
}