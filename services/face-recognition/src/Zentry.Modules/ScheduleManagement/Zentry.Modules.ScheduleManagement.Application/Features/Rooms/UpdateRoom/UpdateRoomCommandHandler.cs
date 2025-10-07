using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Rooms.UpdateRoom;

public class UpdateRoomCommandHandler(IRoomRepository roomRepository)
    : ICommandHandler<UpdateRoomCommand, RoomDto>
{
    public async Task<RoomDto> Handle(UpdateRoomCommand command, CancellationToken cancellationToken)
    {
        var room = await roomRepository.GetByIdAsync(command.Id, cancellationToken);

        if (room is null) throw new ResourceNotFoundException($"Room with ID '{command.Id}' not found.");

        if (room.RoomName != command.RoomName)
        {
            var isRoomNameUnique =
                await roomRepository.IsRoomNameUniqueExcludingSelfAsync(command.Id, command.RoomName, room.Building,
                    cancellationToken);
            if (!isRoomNameUnique)
                throw new ResourceAlreadyExistsException(
                    $"Room with name '{command.RoomName}' already exists for another room in the same building.");
        }

        room.Update(
            command.RoomName,
            command.Building
        );

        await roomRepository.UpdateAsync(room, cancellationToken);

        var responseDto = new RoomDto
        {
            Id = room.Id,
            RoomName = room.RoomName,
            Building = room.Building,
            CreatedAt = room.CreatedAt,
            UpdatedAt = room.UpdatedAt
        };

        return responseDto;
    }
}