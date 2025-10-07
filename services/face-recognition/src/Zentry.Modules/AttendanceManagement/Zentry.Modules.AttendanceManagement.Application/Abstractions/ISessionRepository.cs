using Zentry.Modules.AttendanceManagement.Domain.Entities;
using Zentry.SharedKernel.Abstractions.Data;

namespace Zentry.Modules.AttendanceManagement.Application.Abstractions;

public interface ISessionRepository : IRepository<Session, Guid>
{
    public Task<List<Session>> GetSessionsByScheduleIdsAndDateRangeAsync(
        List<Guid> scheduleIds,
        DateTime startUtc,
        DateTime endUtc,
        CancellationToken cancellationToken);

    Task<Session?> GetSessionsWithAttendanceRecordsByIdAsync(Guid sessionId, CancellationToken cancellationToken);

    Task<List<Session>> GetSessionsWithAttendanceRecordsByScheduleIdsAsync(List<Guid> scheduleIds,
        CancellationToken cancellationToken);

    Task<List<Session>> GetUpcomingSessionsByScheduleIdsAsync(List<Guid> scheduleIds,
        CancellationToken cancellationToken);

    Task DeleteRangeAsync(IEnumerable<Session> sessions, CancellationToken cancellationToken);
    Task UpdateRangeAsync(IEnumerable<Session> entities, CancellationToken cancellationToken);
    Task<List<Session>> GetSessionsByScheduleIdsAsync(List<Guid> scheduleIds, CancellationToken cancellationToken);

    Task<List<Session>> GetSessionsByScheduleIdsAndDatesAsync(
        List<Guid> scheduleIds,
        List<DateOnly> localDates,
        CancellationToken cancellationToken);

    Task<List<Session>> GetSessionsByScheduleIdAsync(Guid scheduleId, CancellationToken cancellationToken);

    Task<Session?> GetSessionByScheduleIdAndDate(Guid scheduleId, DateTime date,
        CancellationToken cancellationToken);

    Task<Guid> GetLecturerIdBySessionId(Guid sessionId, CancellationToken cancellationToken);

    Task<Session?> GetSessionByScheduleIdAndDateAsync(Guid scheduleId, DateOnly date,
        CancellationToken cancellationToken);

    Task<List<Session>> GetSessionsByScheduleIdsAndDateAsync(
        List<Guid> scheduleIds, DateOnly date, CancellationToken cancellationToken);

    Task<DateTime?> GetActualEndTimeAsync(Guid sessionId, CancellationToken cancellationToken);
}