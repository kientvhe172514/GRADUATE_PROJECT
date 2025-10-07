using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Rooms.UpdateRoom;

public class UpdateRoomCommand(Guid roomId, UpdateRoomRequest request)
    : ICommand<RoomDto>
{
    public Guid Id { get; init; } = roomId;
    public string? RoomName { get; init; } = request.RoomName;
    public string? Building { get; init; } = request.Building;
}