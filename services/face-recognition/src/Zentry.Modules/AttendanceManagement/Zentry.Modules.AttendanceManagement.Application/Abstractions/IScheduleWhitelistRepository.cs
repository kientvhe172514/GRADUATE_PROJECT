using Zentry.Modules.AttendanceManagement.Domain.Entities;

namespace Zentry.Modules.AttendanceManagement.Application.Abstractions;

public interface IScheduleWhitelistRepository
{
    Task AddAsync(ScheduleWhitelist whitelist, CancellationToken cancellationToken = default);

    Task<ScheduleWhitelist?> GetByScheduleIdAsync(Guid scheduleId, CancellationToken cancellationToken = default);

    Task UpdateAsync(ScheduleWhitelist whitelist, CancellationToken cancellationToken = default);

    Task<bool> AnyAsync(CancellationToken cancellationToken = default);

    Task<List<ScheduleWhitelist>> GetAllAsync(CancellationToken cancellationToken = default);

    Task AddRangeAsync(IEnumerable<ScheduleWhitelist> whitelists, CancellationToken cancellationToken = default);

    Task DeleteAllAsync(CancellationToken cancellationToken = default);
    Task UpsertAsync(ScheduleWhitelist whitelist, CancellationToken cancellationToken = default);
}