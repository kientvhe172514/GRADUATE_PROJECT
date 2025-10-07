using Zentry.Modules.AttendanceManagement.Application.Dtos;

namespace Zentry.Modules.AttendanceManagement.Application.Services.Interface;

public interface IAttendanceCalculationService
{
    Task<AttendanceCalculationResultDto> CalculateAttendanceForRound(
        Guid sessionId,
        Guid roundId,
        CancellationToken cancellationToken);
}