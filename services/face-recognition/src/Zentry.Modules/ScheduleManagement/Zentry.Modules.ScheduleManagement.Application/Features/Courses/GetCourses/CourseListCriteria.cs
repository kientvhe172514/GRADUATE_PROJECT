namespace Zentry.Modules.ScheduleManagement.Application.Features.Courses.GetCourses;

public class CourseListCriteria
{
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public string? SearchTerm { get; set; }
    public string? Semester { get; set; }
    public string? SortBy { get; set; }
    public string? SortOrder { get; set; } // "asc" or "desc"
}