using Zentry.SharedKernel.Constants.Schedule;

namespace Zentry.Modules.ScheduleManagement.Application.Dtos;

public class ScheduleDetailsWithRelationsDto
{
    public Guid ScheduleId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public WeekDayEnum WeekDay { get; set; }

    public Guid ClassSectionId { get; set; }
    public string SectionCode { get; set; } = string.Empty;

    public string CourseName { get; set; } = string.Empty;

    public Guid RoomId { get; set; }
    public string RoomName { get; set; } = string.Empty;
    public string Building { get; set; } = string.Empty;
}