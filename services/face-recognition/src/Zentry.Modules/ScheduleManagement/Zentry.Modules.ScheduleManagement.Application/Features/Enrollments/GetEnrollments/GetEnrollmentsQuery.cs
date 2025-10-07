using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Schedule;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Enrollments.GetEnrollments;

public class GetEnrollmentsQuery : IQuery<GetEnrollmentsResponse>
{
    public GetEnrollmentsQuery(GetEnrollmentsRequest request)
    {
        PageNumber = request.PageNumber;
        PageSize = request.PageSize;
        SearchTerm = request.SearchTerm;
        StudentId = request.StudentId;
        CourseId = request.CourseId;
        SortBy = request.SortBy;
        SortOrder = request.SortOrder;
        Status = ParseEnrollmentStatus(request.Status);
        ClassSectionId = request.ClassSectionId;
    }

    public Guid AdminId { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public string? SearchTerm { get; set; }
    public Guid? StudentId { get; set; }
    public Guid? ClassSectionId { get; set; }
    public Guid? CourseId { get; set; }
    public EnrollmentStatus? Status { get; set; }
    public string? SortBy { get; set; }
    public string? SortOrder { get; set; }

    private static EnrollmentStatus? ParseEnrollmentStatus(string? statusString)
    {
        if (string.IsNullOrWhiteSpace(statusString)) return null;

        try
        {
            return EnrollmentStatus.FromName(statusString);
        }
        catch (InvalidOperationException)
        {
            return null;
        }
    }
}

public class GetEnrollmentsResponse
{
    public List<EnrollmentDto> Items { get; set; } = [];
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
}