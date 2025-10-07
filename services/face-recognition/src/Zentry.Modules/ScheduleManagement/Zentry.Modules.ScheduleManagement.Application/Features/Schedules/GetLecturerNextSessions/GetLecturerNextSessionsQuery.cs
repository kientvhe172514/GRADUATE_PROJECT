using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Schedules.GetLecturerNextSessions;

public record GetLecturerNextSessionsQuery(Guid LecturerId) : IQuery<List<NextSessionDto>>;