using Zentry.Modules.AttendanceManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.AttendanceManagement.Application.Features.GetRoundResult;

public record GetRoundResultQuery(Guid RoundId) : IQuery<RoundResultDto>;