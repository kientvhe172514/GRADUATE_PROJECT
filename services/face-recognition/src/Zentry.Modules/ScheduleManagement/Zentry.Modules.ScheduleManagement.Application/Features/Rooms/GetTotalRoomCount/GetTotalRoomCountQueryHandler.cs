using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Rooms.GetTotalRoomCount;

public class GetTotalRoomCountQueryHandler(IRoomRepository roomRepository)
    : IQueryHandler<GetTotalRoomCountQuery, int>
{
    public async Task<int> Handle(GetTotalRoomCountQuery request, CancellationToken cancellationToken)
    {
        return await roomRepository.CountTotalRoomsAsync(cancellationToken);
    }
}