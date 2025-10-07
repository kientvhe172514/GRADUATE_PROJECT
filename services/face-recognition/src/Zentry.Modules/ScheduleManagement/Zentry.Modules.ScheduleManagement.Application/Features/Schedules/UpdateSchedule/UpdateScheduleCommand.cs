using MediatR;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Schedules.UpdateSchedule;

public class UpdateScheduleCommand : ICommand<Unit>
{
    public Guid ScheduleId { get; set; }
    public Guid? RoomId { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
    public string? WeekDay { get; set; }
}

public class UpdateScheduleRequest
{
    public Guid? RoomId { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
    public string? WeekDay { get; set; }
}