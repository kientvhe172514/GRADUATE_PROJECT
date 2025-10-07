using Microsoft.EntityFrameworkCore;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.Modules.AttendanceManagement.Domain.Entities;
using Zentry.Modules.AttendanceManagement.Infrastructure.Persistence;
using Zentry.SharedKernel.Constants.Attendance;

namespace Zentry.Modules.AttendanceManagement.Infrastructure.Repositories;

public class RoundRepository(AttendanceDbContext dbContext) : IRoundRepository
{
    public async Task AddAsync(Round entity, CancellationToken cancellationToken)
    {
        await dbContext.Rounds.AddAsync(entity, cancellationToken);
    }

    public async Task AddRangeAsync(IEnumerable<Round> entities, CancellationToken cancellationToken)
    {
        await dbContext.Rounds.AddRangeAsync(entities, cancellationToken);
    }

    public async Task<IEnumerable<Round>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await dbContext.Rounds.ToListAsync(cancellationToken);
    }

    public async Task<Round?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.Rounds.FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task UpdateAsync(Round entity, CancellationToken cancellationToken)
    {
        dbContext.Rounds.Update(entity);
        await SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateRangeAsync(IEnumerable<Round> entities, CancellationToken cancellationToken)
    {
        dbContext.Rounds.UpdateRange(entities);
        await SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Round entity, CancellationToken cancellationToken)
    {
        dbContext.Rounds.Remove(entity);
        await SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteRangeAsync(IEnumerable<Round> entities, CancellationToken cancellationToken)
    {
        dbContext.Rounds.RemoveRange(entities);
        await SaveChangesAsync(cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<Round>> GetRoundsBySessionIdsAsync(IEnumerable<Guid> sessionIds,
        CancellationToken cancellationToken)
    {
        return await dbContext.Rounds.Where(r => sessionIds.Contains(r.SessionId)).ToListAsync(cancellationToken);
    }

    public async Task<List<Round>> GetRoundsBySessionIdAsync(Guid sessionId,
        CancellationToken cancellationToken = default)
    {
        return await dbContext.Rounds
            .Where(r => r.SessionId == sessionId)
            .OrderBy(r => r.RoundNumber)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountRoundsBySessionIdAsync(Guid sessionId, CancellationToken cancellationToken)
    {
        return await dbContext.Rounds
            .Where(r => r.SessionId == sessionId)
            .CountAsync(cancellationToken);
    }

    public async Task<Guid> GetFirstRoundBySessionIdAsync(Guid sessionId, CancellationToken cancellationToken)
    {
        return await dbContext.Rounds
            .Where(r => r.SessionId == sessionId)
            .OrderBy(r => r.RoundNumber)
            .Select(r => r.Id)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task UpdateRoundStatusAsync(Guid roundId, RoundStatus status,
        CancellationToken cancellationToken = default)
    {
        await dbContext.Rounds
            .Where(r => r.Id == roundId)
            .ExecuteUpdateAsync(sets => sets
                    .SetProperty(r => r.Status, status)
                    .SetProperty(r => r.UpdatedAt, DateTime.UtcNow),
                cancellationToken);
    }

    public async Task<List<Round>> GetActiveRoundsBySessionIdAsync(Guid sessionId,
        CancellationToken cancellationToken = default)
    {
        return await dbContext.Rounds
            .Where(r => r.SessionId == sessionId && r.Status == RoundStatus.Active)
            .OrderBy(r => r.RoundNumber)
            .ToListAsync(cancellationToken);
    }
}