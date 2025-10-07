using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.AttendanceManagement.Application.Features.CalculateRoundAttendance;

public record CalculateRoundAttendanceCommand(Guid SessionId, Guid RoundId)
    : ICommand<CalculateRoundAttendanceResponse>;

public record CalculateRoundAttendanceResponse(bool Success, string Message);