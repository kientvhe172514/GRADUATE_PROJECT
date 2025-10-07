namespace Zentry.Modules.ScheduleManagement.Application.Dtos;

public class SessionDto
{
    public Guid Id { get; set; }
    public Guid ScheduleId { get; set; }
    public string Status { get; set; }
    public string WeekDay { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
}