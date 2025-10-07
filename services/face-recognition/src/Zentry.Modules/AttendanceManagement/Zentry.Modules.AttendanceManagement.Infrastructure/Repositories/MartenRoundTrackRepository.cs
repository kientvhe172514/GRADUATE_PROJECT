using Marten;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.Modules.AttendanceManagement.Domain.Entities;

namespace Zentry.Modules.AttendanceManagement.Infrastructure.Repositories;

public class MartenRoundTrackRepository(IDocumentSession documentSession) : IRoundTrackRepository
{
    public async Task AddOrUpdateAsync(RoundTrack roundTrack, CancellationToken cancellationToken)
    {
        documentSession.Store(roundTrack);
        await documentSession.SaveChangesAsync(cancellationToken);
    }

    public async Task<RoundTrack?> GetRoundTracksByRoundIdAsync(Guid roundId, CancellationToken cancellationToken)
    {
        return await documentSession.LoadAsync<RoundTrack>(roundId, cancellationToken);
    }

    public async Task<List<RoundTrack>> GetRoundTracksByRoundIdsAsync(List<Guid> roundId,
        CancellationToken cancellationToken)
    {
        return (await documentSession.Query<RoundTrack>()
                .Where(rt => roundId.Contains(rt.Id))
                .ToListAsync(cancellationToken))
            .ToList();
    }
}