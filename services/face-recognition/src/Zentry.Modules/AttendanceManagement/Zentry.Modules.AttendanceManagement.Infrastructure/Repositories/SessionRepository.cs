using Microsoft.EntityFrameworkCore;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.Modules.AttendanceManagement.Domain.Entities;
using Zentry.Modules.AttendanceManagement.Infrastructure.Persistence;
using Zentry.SharedKernel.Constants.Attendance;
using Zentry.SharedKernel.Exceptions;
using Zentry.SharedKernel.Extensions;

namespace Zentry.Modules.AttendanceManagement.Infrastructure.Repositories;

public class SessionRepository(AttendanceDbContext dbContext) : ISessionRepository
{
    public async Task<List<Session>> GetSessionsByScheduleIdsAndDateRangeAsync(
        List<Guid> scheduleIds,
        DateTime startUtc,
        DateTime endUtc,
        CancellationToken cancellationToken)
    {
        return await dbContext.Sessions
            .Where(s => scheduleIds.Contains(s.ScheduleId) &&
                        s.StartTime >= startUtc &&
                        s.EndTime <= endUtc)
            .OrderBy(s => s.StartTime)
            .ToListAsync(cancellationToken);
    }

    public async Task<Session?> GetSessionsWithAttendanceRecordsByIdAsync(
        Guid sessionId,
        CancellationToken cancellationToken)
    {
        return await dbContext.Sessions
            .AsNoTracking()
            .Include(s => s.AttendanceRecords)
            .FirstOrDefaultAsync(s => s.Id == sessionId, cancellationToken);
    }

    public async Task<List<Session>> GetSessionsWithAttendanceRecordsByScheduleIdsAsync(
        List<Guid> scheduleIds,
        CancellationToken cancellationToken)
    {
        return await dbContext.Sessions
            .AsNoTracking()
            .Include(s => s.AttendanceRecords)
            .Where(s => scheduleIds.Contains(s.ScheduleId))
            .OrderBy(s => s.StartTime)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Session>> GetUpcomingSessionsByScheduleIdsAsync(
        List<Guid> scheduleIds,
        CancellationToken cancellationToken)
    {
        var nowUtc = DateTime.UtcNow;
        var nowInVietnam = nowUtc.ToVietnamLocalTime();
        var todayInVietnam = DateOnly.FromDateTime(nowInVietnam);
        var (utcStartOfToday, utcEndOfToday) = todayInVietnam.ToUtcRange();

        return await dbContext.Sessions
            .Where(s => scheduleIds.Contains(s.ScheduleId) &&
                        s.StartTime >= utcStartOfToday &&
                        s.StartTime <= utcEndOfToday &&
                        (s.EndTime > nowUtc || s.Status == SessionStatus.Active))
            .OrderBy(s => s.StartTime)
            .ToListAsync(cancellationToken);
    }

    public Task UpdateRangeAsync(IEnumerable<Session> entities, CancellationToken cancellationToken)
    {
        dbContext.Sessions.UpdateRange(entities);
        return Task.CompletedTask;
    }

    public async Task<List<Session>> GetSessionsByScheduleIdsAsync(List<Guid> scheduleIds,
        CancellationToken cancellationToken)
    {
        return await dbContext.Sessions
            .Where(s => scheduleIds.Contains(s.ScheduleId))
            .OrderBy(s => s.StartTime)
            .ToListAsync(cancellationToken);
    }

    public async Task<DateTime?> GetActualEndTimeAsync(Guid sessionId, CancellationToken cancellationToken)
    {
        return await dbContext.Sessions
            .AsNoTracking()
            .Where(s => s.Id == sessionId)
            .Select(s => s.ActualEndTime)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<List<Session>> GetSessionsByScheduleIdsAndDateAsync(
        List<Guid> scheduleIds,
        DateOnly localDate,
        CancellationToken cancellationToken)
    {
        var (utcStart, utcEnd) = localDate.ToUtcRange();

        return await dbContext.Sessions
            .AsNoTracking()
            .Where(s => scheduleIds.Contains(s.ScheduleId) &&
                        s.StartTime >= utcStart &&
                        s.StartTime <= utcEnd)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Session>> GetSessionsByScheduleIdsAndDatesAsync(
        List<Guid> scheduleIds,
        List<DateOnly> localDates,
        CancellationToken cancellationToken)
    {
        var distinctScheduleIds = scheduleIds.Distinct().ToList();

        var allSessions = await dbContext.Sessions
            .AsNoTracking()
            .Where(s => distinctScheduleIds.Contains(s.ScheduleId))
            .ToListAsync(cancellationToken);

        return allSessions.Where(s => localDates.Any(localDate => s.StartTime.IsInVietnamLocalDate(localDate)))
            .ToList();
    }

    public async Task<Session?> GetSessionByScheduleIdAndDateAsync(Guid scheduleId, DateOnly localDate,
        CancellationToken cancellationToken)
    {
        var (utcStart, utcEnd) = localDate.ToUtcRange();

        return await dbContext.Sessions
            .Where(s => s.ScheduleId == scheduleId &&
                        s.StartTime >= utcStart &&
                        s.StartTime < utcEnd)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<Session?> GetSessionByScheduleIdAndDate(Guid scheduleId, DateTime date,
        CancellationToken cancellationToken)
    {
        return await dbContext.Sessions
            .Where(s => s.ScheduleId == scheduleId && s.StartTime.Date == date.Date)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<Guid> GetLecturerIdBySessionId(Guid sessionId, CancellationToken cancellationToken)
    {
        var session = await dbContext.Sessions
            .Where(s => s.Id == sessionId)
            .FirstOrDefaultAsync(cancellationToken);
        if (session is null) throw new ResourceNotFoundException("Session not found");

        if (session.LecturerId is null) throw new ResourceNotFoundException("Lecturer not found");

        return (Guid)session.LecturerId;
    }

    public async Task<List<Session>> GetSessionsByScheduleIdAsync(Guid scheduleId, CancellationToken cancellationToken)
    {
        return await dbContext.Sessions
            .Where(s => s.ScheduleId == scheduleId)
            .OrderBy(s => s.StartTime)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(Session entity, CancellationToken cancellationToken)
    {
        await dbContext.Sessions.AddAsync(entity, cancellationToken);
    }

    public async Task AddRangeAsync(IEnumerable<Session> entities, CancellationToken cancellationToken)
    {
        await dbContext.Sessions.AddRangeAsync(entities, cancellationToken);
    }

    public async Task<IEnumerable<Session>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await dbContext.Sessions.ToListAsync(cancellationToken);
    }

    public async Task<Session?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.Sessions.FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public Task UpdateAsync(Session entity, CancellationToken cancellationToken)
    {
        dbContext.Sessions.Update(entity);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(Session entity, CancellationToken cancellationToken)
    {
        dbContext.Sessions.Remove(entity);
        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteRangeAsync(IEnumerable<Session> sessions, CancellationToken cancellationToken)
    {
        dbContext.Sessions.RemoveRange(sessions);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<IEnumerable<Session>> GetSessionsByScheduleIdAndStatusAsync(Guid scheduleId, SessionStatus status,
        CancellationToken cancellationToken)
    {
        return await dbContext.Sessions
            .Where(s => s.ScheduleId == scheduleId && s.Status == status)
            .ToListAsync(cancellationToken);
    }

    public async Task<Session?> GetActiveSessionByScheduleId(Guid scheduleId, CancellationToken cancellationToken)
    {
        return await dbContext.Sessions
            .FirstOrDefaultAsync(s => s.ScheduleId == scheduleId && s.Status == SessionStatus.Active,
                cancellationToken);
    }
}