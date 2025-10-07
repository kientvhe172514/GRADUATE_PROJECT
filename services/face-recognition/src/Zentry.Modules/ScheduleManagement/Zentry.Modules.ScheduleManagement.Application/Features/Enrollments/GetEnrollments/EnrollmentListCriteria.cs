using Zentry.SharedKernel.Constants.Schedule;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Enrollments.GetEnrollments;

public class EnrollmentListCriteria
{
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public string? SearchTerm { get; set; }
    public Guid? StudentId { get; set; }
    public Guid? ClassSectionId { get; set; }
    public Guid? CourseId { get; set; }
    public EnrollmentStatus? Status { get; set; }
    public string? SortBy { get; set; }
    public string? SortOrder { get; set; }
}