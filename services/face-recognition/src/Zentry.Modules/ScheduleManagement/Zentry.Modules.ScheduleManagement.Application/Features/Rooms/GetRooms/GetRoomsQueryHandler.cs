using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Rooms.GetRooms;

public class GetRoomsQueryHandler(IRoomRepository roomRepository) : IQueryHandler<GetRoomsQuery, GetRoomsResponse>
{
    public async Task<GetRoomsResponse> Handle(GetRoomsQuery query, CancellationToken cancellationToken)
    {
        var criteria = new RoomListCriteria
        {
            PageNumber = query.PageNumber,
            PageSize = query.PageSize,
            SearchTerm = query.SearchTerm,
            Building = query.Building,
            SortBy = query.SortBy,
            SortOrder = query.SortOrder
        };

        var (rooms, totalCount) = await roomRepository.GetPagedRoomsAsync(criteria, cancellationToken);

        var roomDtos = rooms.Select(r => new RoomListItemDto
        {
            Id = r.Id,
            RoomName = r.RoomName,
            Building = r.Building,
            CreatedAt = r.CreatedAt
        }).ToList();

        var response = new GetRoomsResponse
        {
            Items = roomDtos,
            TotalCount = totalCount,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize
        };

        return response;
    }
}