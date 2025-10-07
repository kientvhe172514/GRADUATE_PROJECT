using Microsoft.EntityFrameworkCore;
using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.Modules.ScheduleManagement.Application.Features.Enrollments.GetEnrollments;
using Zentry.Modules.ScheduleManagement.Domain.Entities;
using Zentry.Modules.ScheduleManagement.Domain.ValueObjects;
using Zentry.Modules.ScheduleManagement.Infrastructure.Persistence;
using Zentry.SharedKernel.Constants.Schedule;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ScheduleManagement.Infrastructure.Repositories;

public class EnrollmentRepository(ScheduleDbContext dbContext) : IEnrollmentRepository
{
    public async Task<Dictionary<string, int>> CountStudentsByYearAsync(string yearString,
        CancellationToken cancellationToken)
    {
        var sql = @"
        SELECT cs.""Semester"", COUNT(DISTINCT e.""StudentId"") as ""StudentCount""
        FROM ""Enrollments"" e
        INNER JOIN ""ClassSections"" cs ON e.""ClassSectionId"" = cs.""Id""
        WHERE RIGHT(cs.""Semester"", 2) = {0}
          AND cs.""IsDeleted"" = false
        GROUP BY cs.""Semester""";

        var results = await dbContext.Database
            .SqlQueryRaw<SemesterStudentCountDto>(sql, yearString)
            .ToListAsync(cancellationToken);

        return results.ToDictionary(r => r.Semester, r => r.StudentCount);
    }

    public async Task<Dictionary<string, int>> CountStudentsBySemestersAsync(List<Semester> semesters,
        CancellationToken cancellationToken)
    {
        if (semesters.Count == 0)
            return new Dictionary<string, int>();

        var semesterValues = semesters.Select(s => s.Value).ToList();

        // Step 1: Get all enrollments with active status first
        var activeEnrollments = await dbContext.Enrollments
            .AsNoTracking()
            .Where(e => e.Status == EnrollmentStatus.Active)
            .Select(e => new { e.StudentId, e.ClassSectionId })
            .ToListAsync(cancellationToken);

        // Step 2: Get class sections for the specified semesters
        var relevantClassSections = await dbContext.ClassSections
            .AsNoTracking()
            .Where(cs => !cs.IsDeleted)
            .ToListAsync(cancellationToken);

        // Step 3: Filter on client side and join
        var filteredClassSections = relevantClassSections
            .Where(cs => semesterValues.Contains(cs.Semester.Value))
            .ToDictionary(cs => cs.Id, cs => cs.Semester.Value);

        // Step 4: Join and count on client side
        var result = activeEnrollments
            .Where(e => filteredClassSections.ContainsKey(e.ClassSectionId))
            .Select(e => new { e.StudentId, SemesterValue = filteredClassSections[e.ClassSectionId] })
            .GroupBy(x => x.SemesterValue)
            .ToDictionary(
                group => group.Key,
                group => group.Select(x => x.StudentId).Distinct().Count()
            );

        return result;
    }

    public async Task<List<EnrollmentWithClassSectionDto>> GetActiveEnrollmentsByStudentIdAsync(
        Guid studentId, CancellationToken cancellationToken)
    {
        return await dbContext.Enrollments
            .AsNoTracking()
            .Where(e => e.StudentId == studentId &&
                        e.Status == EnrollmentStatus.Active)
            .Include(e => e.ClassSection)
            .ThenInclude(cs => cs!.Course)
            .Select(e => new EnrollmentWithClassSectionDto
            {
                ClassSectionId = e.ClassSectionId,
                CourseId = e.ClassSection!.CourseId,
                CourseCode = e.ClassSection.Course!.Code,
                CourseName = e.ClassSection.Course.Name,
                SectionCode = e.ClassSection.SectionCode,
                LecturerId = e.ClassSection.LecturerId
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<List<EnrollmentProjectionDto>> GetEnrollmentsWithClassSectionProjectionsByStudentIdAsync(
        Guid studentId,
        CancellationToken cancellationToken)
    {
        return await dbContext.Enrollments
            .AsNoTracking()
            .Where(e => e.StudentId == studentId &&
                        e.Status == EnrollmentStatus.Active &&
                        e.ClassSection != null &&
                        e.ClassSection.Course != null)
            .Select(e => new EnrollmentProjectionDto
            {
                ClassSectionId = e.ClassSectionId,
                LecturerId = e.ClassSection.LecturerId,
                CourseId = e.ClassSection.CourseId,
                CourseCode = e.ClassSection.Course!.Code,
                CourseName = e.ClassSection.Course.Name,
                SectionCode = e.ClassSection.SectionCode
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Enrollment>> GetEnrollmentsByStudentIdAsync(Guid studentId,
        CancellationToken cancellationToken)
    {
        return await dbContext.Enrollments
            .Include(e => e.ClassSection)
            .ThenInclude(cs => cs.Course)
            .Where(e => e.StudentId == studentId &&
                        e.Status == EnrollmentStatus.Active)
            .ToListAsync(cancellationToken);
    }

    public async Task BulkAddAsync(List<Enrollment> enrollments, CancellationToken cancellationToken)
    {
        await dbContext.Enrollments.AddRangeAsync(enrollments, cancellationToken);
    }

    public async Task<List<Enrollment>> GetEnrollmentsByClassSectionAsync(Guid classSectionId,
        CancellationToken cancellationToken)
    {
        return await dbContext.Enrollments
            .Where(e => e.ClassSectionId == classSectionId &&
                        e.Status != EnrollmentStatus.Cancelled)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Enrollment>> GetEnrollmentsByClassSectionIdAsync(Guid classSectionId,
        CancellationToken cancellationToken)
    {
        return await dbContext.Enrollments
            .AsNoTracking()
            .Where(e => e.ClassSectionId == classSectionId && e.Status != EnrollmentStatus.Cancelled)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountActiveStudentsByClassSectionIdAsync(Guid classSectionId,
        CancellationToken cancellationToken)
    {
        return await dbContext.Enrollments
            .Where(e => e.ClassSectionId == classSectionId && e.Status == EnrollmentStatus.Active)
            .CountAsync(cancellationToken);
    }

    public async Task<List<Guid>> GetActiveStudentIdsByClassSectionIdAsync(Guid classSectionId,
        CancellationToken cancellationToken)
    {
        return await dbContext.Enrollments
            .AsNoTracking()
            .Where(e => e.ClassSectionId == classSectionId &&
                        e.Status == EnrollmentStatus.Active) // Lọc theo ClassSectionId và trạng thái Active
            .Select(e => e.StudentId)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> IsEnrolledAsync(Guid studentId, Guid classSectionId, CancellationToken cancellationToken)
    {
        return await dbContext.Enrollments
            .AsNoTracking()
            .AnyAsync(e => e.StudentId == studentId &&
                           e.ClassSectionId == classSectionId &&
                           e.Status == EnrollmentStatus.Active, cancellationToken);
    }

    public async Task AddAsync(Enrollment entity, CancellationToken cancellationToken)
    {
        await dbContext.Enrollments.AddAsync(entity, cancellationToken);
    }

    public async Task AddRangeAsync(IEnumerable<Enrollment> entities, CancellationToken cancellationToken)
    {
        await dbContext.Enrollments.AddRangeAsync(entities, cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<IEnumerable<Enrollment>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await dbContext.Enrollments
            .Where(e => e.Status != EnrollmentStatus.Cancelled)
            .ToListAsync(cancellationToken);
    }

    public async Task<Enrollment?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.Enrollments
            .Where(e => e.Status != EnrollmentStatus.Cancelled)
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
    }

    public async Task UpdateAsync(Enrollment entity, CancellationToken cancellationToken)
    {
        dbContext.Enrollments.Update(entity);
        await SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Enrollment entity, CancellationToken cancellationToken)
    {
        dbContext.Enrollments.Remove(entity);
        await SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteRangeAsync(IEnumerable<Enrollment> enrollments, CancellationToken cancellationToken)
    {
        dbContext.Enrollments.RemoveRange(enrollments);
        await dbContext.SaveChangesAsync(cancellationToken);
    }


    public async Task<(List<Enrollment> Enrollments, int TotalCount)> GetPagedEnrollmentsAsync(
        EnrollmentListCriteria criteria,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Enrollments
            .Include(e => e.ClassSection!)
            .ThenInclude(cs => cs.Course)
            .AsNoTracking();

        // Filter by CourseId via ClassSection
        if (criteria.CourseId.HasValue && criteria.CourseId.Value != Guid.Empty)
            query = query.Where(e => e.ClassSection != null && e.ClassSection.CourseId == criteria.CourseId.Value);

        // Filter by StudentId
        if (criteria.StudentId.HasValue && criteria.StudentId.Value != Guid.Empty)
            query = query.Where(e => e.StudentId == criteria.StudentId.Value);

        // Filter by ClassSectionId
        if (criteria.ClassSectionId.HasValue && criteria.ClassSectionId.Value != Guid.Empty)
            query = query.Where(e => e.ClassSectionId == criteria.ClassSectionId.Value);

        // Filter by Status
        if (criteria.Status != null)
            query = query.Where(e => e.Status == criteria.Status);

        // SearchTerm by Course Name
        if (!string.IsNullOrWhiteSpace(criteria.SearchTerm))
        {
            var searchTermLower = criteria.SearchTerm.ToLower();
            query = query.Where(e => e.ClassSection != null &&
                                     e.ClassSection.Course != null &&
                                     e.ClassSection.Course.Name.ToLower().Contains(searchTermLower));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        // Sorting
        if (!string.IsNullOrEmpty(criteria.SortBy))
            query = criteria.SortBy.ToLower() switch
            {
                "enrollmentdate" => criteria.SortOrder?.ToLower() == "desc"
                    ? query.OrderByDescending(e => e.EnrolledAt)
                    : query.OrderBy(e => e.EnrolledAt),
                "studentid" => criteria.SortOrder?.ToLower() == "desc"
                    ? query.OrderByDescending(e => e.StudentId)
                    : query.OrderBy(e => e.StudentId),
                "coursename" => criteria.SortOrder?.ToLower() == "desc"
                    ? query.OrderByDescending(e => e.ClassSection!.Course!.Name)
                    : query.OrderBy(e => e.ClassSection!.Course!.Name),
                _ => query.OrderBy(e => e.Id)
            };
        else
            query = query.OrderBy(e => e.EnrolledAt);

        // Pagination
        var enrollments = await query
            .Skip((criteria.PageNumber - 1) * criteria.PageSize)
            .Take(criteria.PageSize)
            .ToListAsync(cancellationToken);

        return (enrollments, totalCount);
    }

    public async Task DeleteAsync(Guid studentId, Guid classSectionId, CancellationToken cancellationToken)
    {
        var enrollmentToDelete = await dbContext.Enrollments
            .FirstOrDefaultAsync(e => e.StudentId == studentId && e.ClassSectionId == classSectionId,
                cancellationToken);

        if (enrollmentToDelete is not null)
        {
            dbContext.Enrollments.Remove(enrollmentToDelete);
            await SaveChangesAsync(cancellationToken);
        }
        else
        {
            throw new ResourceNotFoundException(
                $"No enrollment with class id {classSectionId} and student id {studentId} was found.");
        }
    }
}