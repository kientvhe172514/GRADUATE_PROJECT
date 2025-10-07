using Zentry.Modules.AttendanceManagement.Domain.Entities;

namespace Zentry.Modules.AttendanceManagement.Application.Abstractions;

public interface IStudentTrackRepository
{
    Task AddOrUpdateAsync(StudentTrack studentTrack, CancellationToken cancellationToken);

    Task<StudentTrack?> GetBySessionIdAndUserIdAsync(Guid sessionId, Guid studentId,
        CancellationToken cancellationToken);

    Task<StudentTrack?> GetByDeviceIdAsync(string deviceId, CancellationToken cancellationToken);

    Task<List<StudentTrack>> GetStudentTracksBySessionIdAsync(Guid sessionId,
        CancellationToken cancellationToken = default);
}