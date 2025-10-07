using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.Modules.ScheduleManagement.Domain.Entities;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Rooms.CreateRoom;

public class CreateRoomCommandHandler(IRoomRepository roomRepository)
    : ICommandHandler<CreateRoomCommand, CreateRoomResponse>
{
    public async Task<CreateRoomResponse> Handle(CreateRoomCommand command, CancellationToken cancellationToken)
    {
        var isRoomNameUnique =
            await roomRepository.IsRoomNameUniqueAsync(command.RoomName, command.Building, cancellationToken);
        if (!isRoomNameUnique)
            throw new ResourceAlreadyExistsException($"Room with name '{command.RoomName}' already exists.");

        var room = Room.Create(
            command.RoomName,
            command.Building
        );

        await roomRepository.AddAsync(room, cancellationToken);
        await roomRepository.SaveChangesAsync(cancellationToken);

        var responseDto = new CreateRoomResponse
        {
            Id = room.Id,
            RoomName = room.RoomName,
            Building = room.Building,
            CreatedAt = room.CreatedAt
        };

        return responseDto;
    }
}