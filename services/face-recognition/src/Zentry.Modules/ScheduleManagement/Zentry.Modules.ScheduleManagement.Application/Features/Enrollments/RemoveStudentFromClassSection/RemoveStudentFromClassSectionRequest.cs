namespace Zentry.Modules.ScheduleManagement.Application.Features.Enrollments.RemoveStudentFromClassSection;

public class RemoveStudentFromClassSectionRequest
{
    public Guid ClassSectionId { get; set; }
    public Guid StudentId { get; set; }
}