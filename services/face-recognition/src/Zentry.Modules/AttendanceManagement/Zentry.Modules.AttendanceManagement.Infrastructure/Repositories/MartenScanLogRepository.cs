using Marten;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.Modules.AttendanceManagement.Domain.Entities;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.AttendanceManagement.Infrastructure.Repositories;

public class MartenScanLogRepository(IDocumentSession session) : IScanLogRepository
{
    public async Task AddScanDataAsync(ScanLog record)
    {
        session.Store(record);
        await session.SaveChangesAsync();
    }

    public async Task<List<ScanLog>> GetScanLogsByRoundIdAsync(Guid roundId, CancellationToken cancellationToken)
    {
        return (List<ScanLog>)await session.Query<ScanLog>()
            .Where(s => s.RoundId == roundId)
            .ToListAsync(cancellationToken);
    }

    public async Task<ScanLog> GetScanDataByIdAsync(Guid id)
    {
        return await session.LoadAsync<ScanLog>(id) ?? throw new NotFoundException(nameof(ScanLog), id);
    }

    public async Task<bool> HasLecturerScanLogInRoundAsync(Guid roundId, Guid lecturerUserId,
        CancellationToken cancellationToken)
    {
        return await session.Query<ScanLog>()
            .AnyAsync(s => s.RoundId == roundId && s.SubmitterUserId == lecturerUserId, cancellationToken);
    }
}