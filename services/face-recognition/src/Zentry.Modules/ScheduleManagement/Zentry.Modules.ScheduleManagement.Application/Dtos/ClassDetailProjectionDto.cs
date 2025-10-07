namespace Zentry.Modules.ScheduleManagement.Application.Dtos;

public class ClassDetailProjectionDto
{
    public string CourseName { get; set; } = string.Empty;
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public string Building { get; set; } = string.Empty;
}