using Zentry.Modules.AttendanceManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.AttendanceManagement.Application.Features.GetSessionFinalAttendance;

public record GetSessionFinalAttendanceQuery(Guid SessionId) : IQuery<List<FinalAttendanceDto>>;