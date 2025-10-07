namespace Zentry.Modules.ScheduleManagement.Application.Features.Enrollments.GetEnrollments;

public class GetEnrollmentsRequest
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SearchTerm { get; set; }
    public Guid? StudentId { get; set; }
    public Guid? ClassSectionId { get; set; }
    public Guid? CourseId { get; set; }
    public string? Status { get; set; }
    public string? SortBy { get; set; }
    public string? SortOrder { get; set; }
}