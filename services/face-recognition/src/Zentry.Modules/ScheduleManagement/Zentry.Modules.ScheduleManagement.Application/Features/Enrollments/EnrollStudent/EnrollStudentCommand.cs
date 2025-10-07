using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Enrollments.EnrollStudent;

public class EnrollStudentCommand : ICommand<EnrollmentResponse>
{
    public Guid ClassSectionId { get; set; }
    public Guid StudentId { get; set; }
}

public class EnrollmentResponse
{
    public Guid EnrollmentId { get; set; }
    public Guid ClassSectionId { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public DateTime EnrollmentDate { get; set; }
    public string Status { get; set; } = string.Empty;
}