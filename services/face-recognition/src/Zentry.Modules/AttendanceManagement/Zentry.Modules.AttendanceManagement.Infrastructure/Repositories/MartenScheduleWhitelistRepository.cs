using Marten;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.Modules.AttendanceManagement.Domain.Entities;

namespace Zentry.Modules.AttendanceManagement.Infrastructure.Repositories;

public class MartenScheduleWhitelistRepository(IDocumentSession session) : IScheduleWhitelistRepository
{
    public async Task AddAsync(ScheduleWhitelist whitelist, CancellationToken cancellationToken = default)
    {
        session.Store(whitelist);
        await SaveChangesAsync(cancellationToken);
    }

    public async Task<ScheduleWhitelist?> GetByScheduleIdAsync(Guid scheduleId,
        CancellationToken cancellationToken = default)
    {
        return await session.Query<ScheduleWhitelist>()
            .FirstOrDefaultAsync(w => w.ScheduleId == scheduleId, cancellationToken);
    }

    public async Task UpdateAsync(ScheduleWhitelist whitelist, CancellationToken cancellationToken = default)
    {
        session.Store(whitelist);
        await SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> AnyAsync(CancellationToken cancellationToken = default)
    {
        return await session.Query<ScheduleWhitelist>()
            .AnyAsync(cancellationToken);
    }

    public async Task<List<ScheduleWhitelist>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return (List<ScheduleWhitelist>)await session.Query<ScheduleWhitelist>()
            .ToListAsync(cancellationToken);
    }

    public async Task AddRangeAsync(IEnumerable<ScheduleWhitelist> whitelists,
        CancellationToken cancellationToken = default)
    {
        session.StoreObjects(whitelists);
        await SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAllAsync(CancellationToken cancellationToken = default)
    {
        session.DeleteWhere<ScheduleWhitelist>(w => true);
        await SaveChangesAsync(cancellationToken);
    }

    public async Task UpsertAsync(ScheduleWhitelist whitelist, CancellationToken cancellationToken = default)
    {
        // Store method will insert if not exists, update if exists
        session.Store(whitelist);
        await SaveChangesAsync(cancellationToken);
    }

    private async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await session.SaveChangesAsync(cancellationToken);
    }
}