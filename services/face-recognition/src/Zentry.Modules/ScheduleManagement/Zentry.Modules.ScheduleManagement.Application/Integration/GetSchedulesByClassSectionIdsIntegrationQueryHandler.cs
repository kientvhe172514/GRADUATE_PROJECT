using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Schedule;

namespace Zentry.Modules.ScheduleManagement.Application.Integration;

public class GetSchedulesByClassSectionIdsIntegrationQueryHandler(
    IScheduleRepository scheduleRepository)
    : IQueryHandler<GetSchedulesByClassSectionIdsIntegrationQuery, GetSchedulesByClassSectionIdsIntegrationResponse>
{
    public async Task<GetSchedulesByClassSectionIdsIntegrationResponse> Handle(
        GetSchedulesByClassSectionIdsIntegrationQuery request,
        CancellationToken cancellationToken)
    {
        var schedules = await scheduleRepository.GetSchedulesByClassSectionIdsAsync(
            request.ClassSectionIds,
            cancellationToken);
        var response = schedules.Select(s =>
                new ScheduleRoomInfoDto(s.Id, s.Room != null
                    ? $"{s.Room.RoomName} ({s.Room.Building})"
                    : "N/A"))
            .ToList();
        return new GetSchedulesByClassSectionIdsIntegrationResponse(response);
    }
}