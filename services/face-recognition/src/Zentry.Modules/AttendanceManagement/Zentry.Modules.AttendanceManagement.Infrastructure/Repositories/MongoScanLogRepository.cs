using MongoDB.Driver;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.Modules.AttendanceManagement.Domain.Entities;

namespace Zentry.Modules.AttendanceManagement.Infrastructure.Repositories;

public class MongoScanLogRepository(IMongoDatabase database) : IScanLogRepository
{
    private readonly IMongoCollection<ScanLog> _collection = database.GetCollection<ScanLog>("scanData");

    public async Task AddScanDataAsync(ScanLog record)
    {
        await _collection.InsertOneAsync(record);
    }

    public async Task<List<ScanLog>> GetScanLogsByRoundIdAsync(Guid roundId, CancellationToken cancellationToken)
    {
        return await _collection.Find(s => s.RoundId == roundId).ToListAsync(cancellationToken);
    }

    public async Task<ScanLog> GetScanDataByIdAsync(Guid id)
    {
        return await _collection.Find(r => r.Id == id).FirstOrDefaultAsync();
    }

    public Task<bool> HasLecturerScanLogInRoundAsync(Guid roundId, Guid lecturerUserId,
        CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }
}