using Zentry.Modules.AttendanceManagement.Domain.Entities;

namespace Zentry.Modules.AttendanceManagement.Application.Services.Interface;

public interface IAttendancePersistenceService
{
    Task PersistAttendanceResult(
        Round currentRound,
        List<string> attendedDeviceIds,
        CancellationToken cancellationToken);
}