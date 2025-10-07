using Zentry.Modules.AttendanceManagement.Domain.Entities;

namespace Zentry.Modules.AttendanceManagement.Application.Abstractions;

public interface IRoundTrackRepository
{
    Task AddOrUpdateAsync(RoundTrack roundTrack, CancellationToken cancellationToken);
    Task<RoundTrack?> GetRoundTracksByRoundIdAsync(Guid roundId, CancellationToken cancellationToken);
    Task<List<RoundTrack>> GetRoundTracksByRoundIdsAsync(List<Guid> roundId, CancellationToken cancellationToken);
}