using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.ClassSections.GetClassSections;

public record GetClassSectionsQuery(
    int PageNumber,
    int PageSize,
    string? SearchTerm = null,
    Guid? CourseId = null,
    Guid? LecturerId = null, // Lọc theo giảng viên
    Guid? StudentId = null, // Lọc theo sinh viên
    string? SortBy = null,
    string? SortOrder = null
) : IQuery<GetClassSectionsResponse>;

public class GetClassSectionsResponse
{
    public List<ClassSectionListItemDto> Items { get; set; } = new(); // Dùng DTO mới
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
}