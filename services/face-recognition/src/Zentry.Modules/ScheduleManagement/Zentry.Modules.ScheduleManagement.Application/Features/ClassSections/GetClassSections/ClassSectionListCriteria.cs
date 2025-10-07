namespace Zentry.Modules.ScheduleManagement.Application.Features.ClassSections.GetClassSections;

public class ClassSectionListCriteria
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SearchTerm { get; set; }

    public Guid? CourseId { get; set; }
    public Guid? LecturerId { get; set; }
    public Guid? StudentId { get; set; }

    public string? SortBy { get; set; }
    public string? SortOrder { get; set; } // Thứ tự sắp xếp ("asc" hoặc "desc")
}