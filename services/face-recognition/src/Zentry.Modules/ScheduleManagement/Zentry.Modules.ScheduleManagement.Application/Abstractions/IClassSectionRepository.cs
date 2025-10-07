using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.Modules.ScheduleManagement.Application.Features.ClassSections.GetClassSections;
using Zentry.Modules.ScheduleManagement.Domain.Entities;
using Zentry.Modules.ScheduleManagement.Domain.ValueObjects;
using Zentry.SharedKernel.Abstractions.Data;

namespace Zentry.Modules.ScheduleManagement.Application.Abstractions;

public interface IClassSectionRepository : IRepository<ClassSection, Guid>
{
    Task<List<CourseWithClassSectionCountDto>> GetTopCoursesWithClassSectionCountAsync(int count,
        CancellationToken cancellationToken);

    Task<int> CountTotalClassSectionsAsync(CancellationToken cancellationToken);
    Task<List<ClassSectionInYearDto>> GetClassSectionsByYearAsync(string year, CancellationToken cancellationToken);
    Task UpdateRangeAsync(IEnumerable<ClassSection> entities, CancellationToken cancellationToken);

    Task<Dictionary<string, int>> CountClassSectionsBySemestersAsync(string yearString,
        CancellationToken cancellationToken);

    Task<List<ClassSection>> GetClassSectionsDetailsByIdsAsync(
        List<Guid> classSectionIds,
        CancellationToken cancellationToken);

    Task<List<ClassSection>> GetLecturerClassSectionsInSemesterAsync(Guid lecturerId, Semester semester,
        CancellationToken cancellationToken);

    Task<(List<ClassSection> Items, int TotalCount)> GetPagedClassSectionsAsync(
        ClassSectionListCriteria criteria,
        CancellationToken cancellationToken);

    Task<List<ClassSection>> GetBySectionCodesAsync(List<string> sectionCodes, CancellationToken cancellationToken);
    Task SoftDeleteAsync(Guid id, CancellationToken cancellationToken);
    public Task<List<ClassSection>> GetLecturerClassSectionsAsync(Guid lecturerId, CancellationToken cancellationToken);
    Task<ClassSection?> GetByScheduleIdAsync(Guid scheduleId, CancellationToken cancellationToken);
    Task<bool> IsExistClassSectionByCourseIdAsync(Guid courseId, CancellationToken cancellationToken);
    Task<bool> IsExistClassSectionBySectionCodeAsync(Guid id, string sectionCode, CancellationToken cancellationToken);

    Task<ClassSection?> GetBySectionCodeAsync(string sectionCode,
        CancellationToken cancellationToken = default);
}