using Zentry.SharedKernel.Constants.Schedule;

namespace Zentry.Modules.ScheduleManagement.Application.Dtos;

public class ScheduleWithRoomDto
{
    public Guid Id { get; set; }
    public Guid ClassSectionId { get; set; }
    public Guid RoomId { get; set; }
    public string RoomName { get; set; } = string.Empty;
    public string Building { get; set; } = string.Empty;
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public WeekDayEnum WeekDay { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
}