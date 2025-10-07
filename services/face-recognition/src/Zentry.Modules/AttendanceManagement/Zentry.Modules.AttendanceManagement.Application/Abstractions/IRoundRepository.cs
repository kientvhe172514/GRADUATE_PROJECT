using Zentry.Modules.AttendanceManagement.Domain.Entities;
using Zentry.SharedKernel.Abstractions.Data;
using Zentry.SharedKernel.Constants.Attendance;

namespace Zentry.Modules.AttendanceManagement.Application.Abstractions;

public interface IRoundRepository : IRepository<Round, Guid>
{
    Task<List<Round>> GetRoundsBySessionIdsAsync(IEnumerable<Guid> sessionIds, CancellationToken cancellationToken);
    Task<List<Round>> GetRoundsBySessionIdAsync(Guid sessionId, CancellationToken cancellationToken);
    Task<int> CountRoundsBySessionIdAsync(Guid sessionId, CancellationToken cancellationToken);
    Task<Guid> GetFirstRoundBySessionIdAsync(Guid sessionId, CancellationToken cancellationToken);
    Task UpdateRoundStatusAsync(Guid roundId, RoundStatus status, CancellationToken cancellationToken = default);
    Task<List<Round>> GetActiveRoundsBySessionIdAsync(Guid sessionId, CancellationToken cancellationToken = default);
    Task DeleteRangeAsync(IEnumerable<Round> entities, CancellationToken cancellationToken);
    Task UpdateRangeAsync(IEnumerable<Round> entities, CancellationToken cancellationToken);
}