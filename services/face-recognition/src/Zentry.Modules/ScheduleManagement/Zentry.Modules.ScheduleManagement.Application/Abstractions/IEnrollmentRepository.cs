using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.Modules.ScheduleManagement.Application.Features.Enrollments.GetEnrollments;
using Zentry.Modules.ScheduleManagement.Domain.Entities;
using Zentry.Modules.ScheduleManagement.Domain.ValueObjects;
using Zentry.SharedKernel.Abstractions.Data;

namespace Zentry.Modules.ScheduleManagement.Application.Abstractions;

public interface IEnrollmentRepository : IRepository<Enrollment, Guid>
{
    Task<Dictionary<string, int>> CountStudentsByYearAsync(string yearString,
        CancellationToken cancellationToken);

    Task<Dictionary<string, int>> CountStudentsBySemestersAsync(List<Semester> semesters,
        CancellationToken cancellationToken);

    Task<List<EnrollmentWithClassSectionDto>> GetActiveEnrollmentsByStudentIdAsync(
        Guid studentId, CancellationToken cancellationToken);

    Task<bool> IsEnrolledAsync(Guid studentId, Guid scheduleId, CancellationToken cancellationToken);

    Task<(List<Enrollment> Enrollments, int TotalCount)> GetPagedEnrollmentsAsync(
        EnrollmentListCriteria criteria,
        CancellationToken cancellationToken);

    Task<List<Guid>> GetActiveStudentIdsByClassSectionIdAsync(Guid classSectionId, CancellationToken cancellationToken);
    Task<int> CountActiveStudentsByClassSectionIdAsync(Guid classSectionId, CancellationToken cancellationToken);

    Task<List<Enrollment>>
        GetEnrollmentsByClassSectionIdAsync(Guid classSectionId, CancellationToken cancellationToken);

    Task BulkAddAsync(List<Enrollment> enrollments, CancellationToken cancellationToken);
    Task<List<Enrollment>> GetEnrollmentsByClassSectionAsync(Guid classSectionId, CancellationToken cancellationToken);
    Task<List<Enrollment>> GetEnrollmentsByStudentIdAsync(Guid studentId, CancellationToken cancellationToken);

    Task<List<EnrollmentProjectionDto>> GetEnrollmentsWithClassSectionProjectionsByStudentIdAsync(
        Guid studentId,
        CancellationToken cancellationToken);

    Task DeleteRangeAsync(IEnumerable<Enrollment> enrollments, CancellationToken cancellationToken);
    Task DeleteAsync(Guid studentId, Guid classSectionId, CancellationToken cancellationToken);
}