using Zentry.Modules.AttendanceManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.AttendanceManagement.Application.Features.GetSessionRounds;

public record GetSessionRoundsQuery(Guid SessionId) : IQuery<List<RoundAttendanceDto>>;