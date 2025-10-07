using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Rooms.GetRoomById;

public class GetRoomByIdQueryHandler(IRoomRepository roomRepository) : IQueryHandler<GetRoomByIdQuery, RoomDto?>
{
    public async Task<RoomDto?> Handle(GetRoomByIdQuery query, CancellationToken cancellationToken)
    {
        var room = await roomRepository.GetByIdAsync(query.Id, cancellationToken);

        if (room is null)
            throw new ResourceNotFoundException("ROOM", query.Id);
        var roomDetailDto = new RoomDto
        {
            Id = room.Id,
            RoomName = room.RoomName,
            Building = room.Building,
            CreatedAt = room.CreatedAt,
            UpdatedAt = room.UpdatedAt
        };

        return roomDetailDto;
    }
}