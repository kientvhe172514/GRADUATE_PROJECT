using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Schedules.GetStudentNextSessions;

public record GetStudentNextSessionsQuery(Guid StudentId) : IQuery<List<NextSessionDto>>;