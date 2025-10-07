using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Enrollments.EnrollMultipleStudents;

public class BulkEnrollStudentsCommand : ICommand<BulkEnrollmentResponse>
{
    public Guid ClassSectionId { get; set; }
    public List<Guid> StudentIds { get; set; } = new();
}

public class BulkEnrollmentResponse
{
    public Guid ClassSectionId { get; set; }
    public int TotalStudents { get; set; }
    public int SuccessfulEnrollments { get; set; }
    public int FailedEnrollments { get; set; }
    public List<EnrollmentResult> Results { get; set; } = new();
    public List<string> Errors { get; set; } = new();
}

public class EnrollmentResult
{
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public bool IsSuccess { get; set; }
    public string? ErrorMessage { get; set; }
    public Guid? EnrollmentId { get; set; }
    public DateTime? EnrollmentDate { get; set; }
}