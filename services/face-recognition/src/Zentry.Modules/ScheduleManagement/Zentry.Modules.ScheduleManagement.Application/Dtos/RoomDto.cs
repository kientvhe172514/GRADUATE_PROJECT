namespace Zentry.Modules.ScheduleManagement.Application.Dtos;

public class RoomDto
{
    public Guid Id { get; set; }
    public string RoomName { get; set; } = string.Empty;
    public string Building { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}