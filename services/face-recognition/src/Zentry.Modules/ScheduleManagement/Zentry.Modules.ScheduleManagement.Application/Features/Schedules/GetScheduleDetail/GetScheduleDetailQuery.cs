using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Schedules.GetScheduleDetail;

public record GetScheduleDetailQuery(Guid ScheduleId) : IQuery<ScheduleDetailDto>;