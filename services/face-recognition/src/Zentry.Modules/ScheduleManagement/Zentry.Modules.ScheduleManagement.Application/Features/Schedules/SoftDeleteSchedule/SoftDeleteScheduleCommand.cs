using MediatR;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Schedules.SoftDeleteSchedule;

public class SoftDeleteScheduleCommand : ICommand<Unit>
{
    public Guid ScheduleId { get; set; }
}