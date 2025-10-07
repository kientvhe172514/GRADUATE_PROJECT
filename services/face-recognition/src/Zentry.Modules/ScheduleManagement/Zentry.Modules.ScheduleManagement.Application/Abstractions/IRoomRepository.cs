using Zentry.Modules.ScheduleManagement.Application.Features.Rooms.GetRooms;
using Zentry.Modules.ScheduleManagement.Domain.Entities;
using Zentry.SharedKernel.Abstractions.Data;

namespace Zentry.Modules.ScheduleManagement.Application.Abstractions;

public interface IRoomRepository : IRepository<Room, Guid>
{
    Task<int> CountTotalRoomsAsync(CancellationToken cancellationToken);
    Task<bool> IsRoomNameUniqueAsync(string roomName, string building, CancellationToken cancellationToken);

    Task<Tuple<List<Room>, int>> GetPagedRoomsAsync(RoomListCriteria criteria, CancellationToken cancellationToken);

    Task<bool> IsRoomNameUniqueExcludingSelfAsync(Guid roomId, string? roomName, string building,
        CancellationToken cancellationToken);

    Task SoftDeleteAsync(Guid id, CancellationToken cancellationToken);
    Task<List<Room>> GetByRoomNamesAsync(List<string> roomNames, CancellationToken cancellationToken);
}