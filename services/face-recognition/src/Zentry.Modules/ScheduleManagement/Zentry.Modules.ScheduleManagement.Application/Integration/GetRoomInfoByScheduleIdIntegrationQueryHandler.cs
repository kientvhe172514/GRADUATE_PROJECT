using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Schedule;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ScheduleManagement.Application.Integration;

public class GetRoomInfoByScheduleIdIntegrationQueryHandler(
    IScheduleRepository scheduleRepository)
    : IQueryHandler<GetRoomInfoByScheduleIdIntegrationQuery, GetRoomInfoByScheduleIdIntegrationResponse>
{
    public async Task<GetRoomInfoByScheduleIdIntegrationResponse> Handle(
        GetRoomInfoByScheduleIdIntegrationQuery request,
        CancellationToken cancellationToken)
    {
        var schedule =
            await scheduleRepository.GetScheduleDetailsWithRelationsAsync(request.ScheduleId, cancellationToken);
        if (schedule == null) throw new ResourceNotFoundException("Schedule", request.ScheduleId);

        return new GetRoomInfoByScheduleIdIntegrationResponse(
            $"{schedule.RoomName} ({schedule.Building})",
            schedule.RoomId
        );
    }
}