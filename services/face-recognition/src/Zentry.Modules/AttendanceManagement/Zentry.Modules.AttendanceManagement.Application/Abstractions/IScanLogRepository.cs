using Zentry.Modules.AttendanceManagement.Domain.Entities;

namespace Zentry.Modules.AttendanceManagement.Application.Abstractions;

public interface IScanLogRepository
{
    Task AddScanDataAsync(ScanLog record);
    Task<List<ScanLog>> GetScanLogsByRoundIdAsync(Guid roundId, CancellationToken cancellationToken);
    Task<ScanLog> GetScanDataByIdAsync(Guid id);
    Task<bool> HasLecturerScanLogInRoundAsync(Guid roundId, Guid lecturerUserId, CancellationToken cancellationToken);
}