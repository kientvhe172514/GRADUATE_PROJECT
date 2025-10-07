using Microsoft.EntityFrameworkCore;
using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.Modules.ScheduleManagement.Application.Features.ClassSections.GetClassSections;
using Zentry.Modules.ScheduleManagement.Domain.Entities;
using Zentry.Modules.ScheduleManagement.Domain.ValueObjects;
using Zentry.Modules.ScheduleManagement.Infrastructure.Persistence;

namespace Zentry.Modules.ScheduleManagement.Infrastructure.Repositories;

public class ClassSectionRepository(ScheduleDbContext dbContext) : IClassSectionRepository
{
    public async Task<List<CourseWithClassSectionCountDto>> GetTopCoursesWithClassSectionCountAsync(
        int count,
        CancellationToken cancellationToken)
    {
        return await dbContext.ClassSections
            .AsNoTracking()
            .Where(cs => !cs.IsDeleted)
            .GroupBy(cs => cs.CourseId)
            .Select(g => new
            {
                CourseId = g.Key,
                ClassSectionCount = g.Count()
            })
            .OrderByDescending(x => x.ClassSectionCount)
            .Take(count)
            .Join(
                dbContext.Courses,
                groupedCourse => groupedCourse.CourseId,
                course => course.Id,
                (groupedCourse, course) => new CourseWithClassSectionCountDto
                {
                    CourseId = groupedCourse.CourseId,
                    CourseName = course.Name,
                    ClassSectionCount = groupedCourse.ClassSectionCount
                }
            )
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountTotalClassSectionsAsync(CancellationToken cancellationToken)
    {
        return await dbContext.ClassSections.Where(cs => !cs.IsDeleted).CountAsync(cancellationToken);
    }

    public async Task<List<ClassSectionInYearDto>> GetClassSectionsByYearAsync(string year,
        CancellationToken cancellationToken)
    {
        var sql = @"
            SELECT
                ""Id"",
                ""Semester""
            FROM ""ClassSections""
            WHERE RIGHT(""Semester"", 2) = {0} AND ""IsDeleted"" = false";

        return await dbContext.Database
            .SqlQueryRaw<ClassSectionInYearDto>(sql, year)
            .ToListAsync(cancellationToken);
    }

    public async Task<Dictionary<string, int>> CountClassSectionsBySemestersAsync(string yearString,
        CancellationToken cancellationToken)
    {
        var sql = @"
            SELECT
                ""Semester"" AS ""Semester"",
                COUNT(CAST(""Id"" AS TEXT)) AS ""ClassSectionCount""
            FROM ""ClassSections""
            WHERE RIGHT(""Semester"", 2) = {0} AND ""IsDeleted"" = false
            GROUP BY ""Semester""
            ORDER BY ""Semester""";

        var results = await dbContext.Database
            .SqlQueryRaw<SemesterClassSectionCountDto>(sql, yearString)
            .ToListAsync(cancellationToken);

        return results.ToDictionary(r => r.Semester, r => r.ClassSectionCount);
    }

    public async Task<List<ClassSection>> GetClassSectionsDetailsByIdsAsync(
        List<Guid> classSectionIds,
        CancellationToken cancellationToken)
    {
        return await dbContext.ClassSections
            .AsNoTracking()
            .Include(cs => cs.Course)
            .Include(cs => cs.Schedules)
            .ThenInclude(s => s.Room)
            .Include(cs => cs.Enrollments)
            .Where(cs => classSectionIds.Contains(cs.Id) && !cs.IsDeleted)
            .ToListAsync(cancellationToken);
    }

    public async Task<ClassSection?> GetByScheduleIdAsync(Guid scheduleId, CancellationToken cancellationToken)
    {
        return await dbContext.ClassSections
            .Include(cs => cs.Course)
            .Where(cs => !cs.IsDeleted)
            .FirstOrDefaultAsync(cs => cs.Schedules.Any(s => s.Id == scheduleId), cancellationToken);
    }

    public async Task<bool> IsExistClassSectionByCourseIdAsync(Guid courseId, CancellationToken cancellationToken)
    {
        return await dbContext.ClassSections
            .AnyAsync(cs => cs.CourseId == courseId && !cs.IsDeleted, cancellationToken);
    }

    public async Task<bool> IsExistClassSectionBySectionCodeAsync(Guid id, string sectionCode,
        CancellationToken cancellationToken)
    {
        return await dbContext.ClassSections.AnyAsync(
            cs => cs.Id != id && cs.SectionCode == sectionCode && !cs.IsDeleted,
            cancellationToken);
    }

    public async Task<ClassSection?> GetBySectionCodeAsync(string sectionCode,
        CancellationToken cancellationToken = default)
    {
        return await dbContext.ClassSections
            .Where(cs => cs.SectionCode == sectionCode && !cs.IsDeleted)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<List<ClassSection>> GetLecturerClassSectionsAsync(Guid lecturerId,
        CancellationToken cancellationToken)
    {
        return await dbContext.ClassSections
            .Include(cs => cs.Course)
            .Include(cs => cs.Schedules)
            .ThenInclude(s => s.Room)
            .Include(cs => cs.Enrollments)
            .Where(cs => cs.LecturerId == lecturerId && !cs.IsDeleted)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<ClassSection>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await dbContext.ClassSections
            .Include(cs => cs.Course)
            .Include(cs => cs.Enrollments)
            .Where(cs => !cs.IsDeleted)
            .ToListAsync(cancellationToken);
    }

    public async Task<ClassSection?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.ClassSections
            .Include(cs => cs.Course)
            .Include(cs => cs.Schedules)
            .ThenInclude(s => s.Room)
            .Include(cs => cs.Enrollments)
            .FirstOrDefaultAsync(cs => cs.Id == id && !cs.IsDeleted, cancellationToken);
    }

    public async Task AddAsync(ClassSection entity, CancellationToken cancellationToken)
    {
        await dbContext.ClassSections.AddAsync(entity, cancellationToken);
    }

    public async Task AddRangeAsync(IEnumerable<ClassSection> entities, CancellationToken cancellationToken)
    {
        await dbContext.ClassSections.AddRangeAsync(entities, cancellationToken);
    }

    public async Task UpdateAsync(ClassSection entity, CancellationToken cancellationToken)
    {
        dbContext.ClassSections.Update(entity);
        await SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateRangeAsync(IEnumerable<ClassSection> entities, CancellationToken cancellationToken)
    {
        dbContext.ClassSections.UpdateRange(entities);
        await SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(ClassSection entity, CancellationToken cancellationToken)
    {
        dbContext.ClassSections.Remove(entity);
        await SaveChangesAsync(cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        await dbContext.SaveChangesAsync(cancellationToken);
    }


    public async Task<List<ClassSection>> GetLecturerClassSectionsInSemesterAsync(
        Guid lecturerId,
        Semester semester,
        CancellationToken cancellationToken)
    {
        return await dbContext.ClassSections
            .AsNoTracking()
            .Include(cs => cs.Course)
            .Include(cs => cs.Schedules)
            .Include(cs => cs.Enrollments)
            .Where(cs => cs.LecturerId == lecturerId && cs.Semester == semester)
            .Where(cs => !cs.IsDeleted)
            .ToListAsync(cancellationToken);
    }

    public async Task<(List<ClassSection> Items, int TotalCount)> GetPagedClassSectionsAsync(
        ClassSectionListCriteria criteria,
        CancellationToken cancellationToken)
    {
        var query = dbContext.ClassSections
            .Include(cs => cs.Course)
            .AsQueryable();

        // Nếu có lọc theo StudentId, cần include Enrollments
        if (criteria.StudentId.HasValue && criteria.StudentId.Value != Guid.Empty)
            query = query.Include(cs => cs.Enrollments);

        // Lọc theo CourseId
        if (criteria.CourseId.HasValue && criteria.CourseId.Value != Guid.Empty)
            query = query.Where(cs => cs.CourseId == criteria.CourseId.Value);

        // Lọc theo LecturerId
        if (criteria.LecturerId.HasValue && criteria.LecturerId.Value != Guid.Empty)
            query = query.Where(cs => cs.LecturerId == criteria.LecturerId.Value);

        // Lọc theo StudentId
        if (criteria.StudentId.HasValue && criteria.StudentId.Value != Guid.Empty)
            query = query.Where(cs => cs.Enrollments.Any(e => e.StudentId == criteria.StudentId.Value));

        if (!string.IsNullOrWhiteSpace(criteria.SearchTerm))
        {
            var lower = criteria.SearchTerm.ToLower();
            query = query.Where(cs =>
                cs.SectionCode.ToLower().Contains(lower) ||
                (cs.Course != null && cs.Course.Name.ToLower().Contains(lower)) || // Thêm kiểm tra null
                (cs.Course != null && cs.Course.Code.ToLower().Contains(lower))); // Thêm kiểm tra null
        }

        // Cập nhật để chỉ lấy các ClassSection chưa bị xóa mềm
        query = query.Where(cs => !cs.IsDeleted);

        var totalCount = await query.CountAsync(cancellationToken);

        if (!string.IsNullOrWhiteSpace(criteria.SortBy))
            query = criteria.SortBy.ToLower() switch
            {
                "sectioncode" => criteria.SortOrder?.ToLower() == "desc"
                    ? query.OrderByDescending(cs => cs.SectionCode)
                    : query.OrderBy(cs => cs.SectionCode),
                "coursename" => criteria.SortOrder?.ToLower() == "desc"
                    ? query.OrderByDescending(cs => cs.Course!.Name)
                    : query.OrderBy(cs => cs.Course!.Name),
                _ => query.OrderBy(cs => cs.SectionCode)
            };
        else
            query = query.OrderBy(cs => cs.SectionCode);

        var items = await query
            .Skip((criteria.PageNumber - 1) * criteria.PageSize)
            .Take(criteria.PageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<List<ClassSection>> GetBySectionCodesAsync(List<string> sectionCodes,
        CancellationToken cancellationToken)
    {
        return await dbContext.ClassSections.Where(cs => sectionCodes.Contains(cs.SectionCode) && !cs.IsDeleted)
            .ToListAsync(cancellationToken);
    }

    public async Task SoftDeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var classSection = await dbContext.ClassSections.FindAsync([id], cancellationToken);

        if (classSection is not null)
        {
            classSection.Delete();
            dbContext.ClassSections.Update(classSection);
            await SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<List<Semester>> GetDistinctSemestersAsync(CancellationToken cancellationToken)
    {
        return await dbContext.ClassSections
            .AsNoTracking()
            .Where(c => !c.IsDeleted)
            .Select(cs => cs.Semester)
            .Distinct()
            .ToListAsync(cancellationToken);
    }
}