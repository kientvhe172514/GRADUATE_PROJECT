namespace Zentry.Modules.ScheduleManagement.Application.Features.Rooms.GetRooms;

public class RoomListItemDto
{
    public Guid Id { get; set; }
    public string RoomName { get; set; } = string.Empty;
    public string Building { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}