using Zentry.Modules.AttendanceManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.AttendanceManagement.Application.Features.GetStudentSessions;

public record GetStudentSessionsQuery(Guid StudentId) : IQuery<GetStudentSessionsResponse>;

public record GetStudentSessionsResponse(List<StudentSessionDto> Sessions);