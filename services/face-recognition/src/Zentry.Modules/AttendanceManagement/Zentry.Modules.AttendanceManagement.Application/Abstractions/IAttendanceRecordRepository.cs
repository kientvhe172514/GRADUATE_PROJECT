using Zentry.Modules.AttendanceManagement.Domain.Entities;
using Zentry.SharedKernel.Abstractions.Data;

namespace Zentry.Modules.AttendanceManagement.Application.Abstractions;

public interface IAttendanceRecordRepository : IRepository<AttendanceRecord, Guid>
{
    Task<List<AttendanceRecord>> GetStudentAttendanceRecordsForSessionsAsync(Guid studentId, List<Guid> sessionIds,
        CancellationToken cancellationToken);

    Task<List<AttendanceRecord>> GetAttendanceRecordsByStudentIdAndSessionIdsAsync(
        Guid studentId,
        List<Guid> sessionIds,
        CancellationToken cancellationToken);

    Task<List<AttendanceRecord>> GetAttendanceRecordsBySessionIdsAsync(List<Guid> sessionIds,
        CancellationToken cancellationToken);

    Task<(int TotalSessions, int AttendedSessions)> GetAttendanceStatsAsync(Guid studentId, Guid courseId);

    public Task<List<AttendanceRecord>> GetAttendanceRecordsBySessionIdAsync(Guid sessionId,
        CancellationToken cancellationToken);

    Task<AttendanceRecord?> GetByUserIdAndSessionIdAsync(Guid userId, Guid sessionId,
        CancellationToken cancellationToken);

    Task AddOrUpdateAsync(AttendanceRecord entity, CancellationToken cancellationToken);
}