namespace Zentry.Modules.ScheduleManagement.Application.Dtos;

public class SessionInfoDto
{
    public Guid SessionId { get; set; }
    public Guid ScheduleId { get; set; }
    public int SessionNumber { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
}