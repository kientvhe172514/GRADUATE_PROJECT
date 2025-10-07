using Marten;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.Modules.AttendanceManagement.Domain.Entities;

namespace Zentry.Modules.AttendanceManagement.Infrastructure.Repositories;

public class MartenStudentTrackRepository(IDocumentSession documentSession) : IStudentTrackRepository
{
    public async Task AddOrUpdateAsync(StudentTrack studentTrack, CancellationToken cancellationToken)
    {
        documentSession.Store(studentTrack);
        await documentSession.SaveChangesAsync(cancellationToken);
    }

    public async Task<StudentTrack?> GetBySessionIdAndUserIdAsync(Guid sessionId, Guid studentId,
        CancellationToken cancellationToken)
    {
        return await documentSession.Query<StudentTrack>()
            .FirstOrDefaultAsync(s => s.SessionId == sessionId
                                      && s.StudentId == studentId, cancellationToken);
    }

    public async Task<StudentTrack?> GetByDeviceIdAsync(string deviceId, CancellationToken cancellationToken)
    {
        return await documentSession.Query<StudentTrack>()
            .FirstOrDefaultAsync(s => s.DeviceId == deviceId, cancellationToken);
    }

    public async Task<List<StudentTrack>> GetStudentTracksBySessionIdAsync(Guid sessionId,
        CancellationToken cancellationToken = default)
    {
        return (await documentSession.Query<StudentTrack>()
            .Where(st => st.SessionId == sessionId)
            .ToListAsync(cancellationToken)).ToList();
    }
}