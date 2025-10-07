namespace Zentry.Modules.ScheduleManagement.Application.Features.Rooms.UpdateRoom;

public record UpdateRoomRequest(
    string RoomName,
    string Building
);