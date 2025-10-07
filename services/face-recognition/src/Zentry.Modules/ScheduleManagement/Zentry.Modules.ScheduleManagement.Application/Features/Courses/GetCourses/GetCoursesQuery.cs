using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Courses.GetCourses;

public class GetCoursesQuery : IQuery<GetCoursesResponse>
{
    public GetCoursesQuery()
    {
    }

    public GetCoursesQuery(int pageNumber, int pageSize, string? searchTerm = null, string? semester = null,
        string? sortBy = null, string? sortOrder = null)
    {
        PageNumber = pageNumber <= 0 ? 1 : pageNumber;
        PageSize = pageSize <= 0 ? 10 : pageSize;
        SearchTerm = searchTerm?.Trim();
        Semester = semester?.Trim();
        SortBy = sortBy?.Trim();
        SortOrder = sortOrder?.Trim();
    }

    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;

    public string? SearchTerm { get; init; }
    public string? Semester { get; init; }
    public string? SortBy { get; init; } = "CreatedAt";
    public string? SortOrder { get; init; } = "desc";
}

public class GetCoursesResponse
{
    public List<CourseDto> Items { get; set; } = [];
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasNextPage => PageNumber * PageSize < TotalCount;
    public bool HasPreviousPage => PageNumber > 1;
}