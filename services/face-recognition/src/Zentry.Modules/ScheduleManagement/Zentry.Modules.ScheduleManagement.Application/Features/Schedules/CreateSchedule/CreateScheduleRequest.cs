using System.ComponentModel.DataAnnotations;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Schedules.CreateSchedule;

public class CreateScheduleRequest
{
    [Required] public Guid ClassSectionId { get; set; }

    [Required] public Guid RoomId { get; set; }

    [Required] public DateOnly StartDate { get; set; }

    [Required] public DateOnly EndDate { get; set; }

    [Required] public TimeOnly StartTime { get; set; }

    [Required] public TimeOnly EndTime { get; set; }

    [Required] [StringLength(10)] public string WeekDay { get; set; } = string.Empty;
}