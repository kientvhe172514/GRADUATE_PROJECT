using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Enrollments.RemoveStudentFromClassSection;

public class RemoveStudentFromClassSectionCommand : ICommand<RemoveEnrollmentByStudentResponse>
{
    public Guid ClassSectionId { get; set; }
    public Guid StudentId { get; set; }
}

public class RemoveEnrollmentByStudentResponse
{
    public bool Status { get; set; }
}