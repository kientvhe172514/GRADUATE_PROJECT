using Zentry.Modules.AttendanceManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.AttendanceManagement.Application.Features.GetSessionRoundsResult;

public record GetSessionRoundsResultQuery(Guid SessionId) : IQuery<SessionRoundsResultDto>;