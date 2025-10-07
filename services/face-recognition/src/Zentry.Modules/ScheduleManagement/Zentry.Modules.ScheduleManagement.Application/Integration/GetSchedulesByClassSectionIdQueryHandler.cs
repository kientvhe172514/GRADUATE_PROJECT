using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Schedule;

namespace Zentry.Modules.ScheduleManagement.Application.Integration;

public class GetSchedulesByClassSectionIdQueryHandler(IScheduleRepository scheduleRepository)
    : IQueryHandler<GetSchedulesByClassSectionIdIntegrationQuery, GetSchedulesByClassSectionIdIntegrationResponse>
{
    public async Task<GetSchedulesByClassSectionIdIntegrationResponse> Handle(
        GetSchedulesByClassSectionIdIntegrationQuery request,
        CancellationToken cancellationToken)
    {
        var schedules =
            await scheduleRepository.GetSchedulesByClassSectionIdAsync(request.ClassSectionId, cancellationToken);

        if (schedules.Count == 0) return new GetSchedulesByClassSectionIdIntegrationResponse([]);

        var scheduleDtos = schedules.Select(s => new ScheduleInfoDto
        {
            ScheduleId = s.Id,
            RoomId = s.RoomId,
            StartDate = s.StartDate,
            EndDate = s.EndDate,
            StartTime = s.StartTime,
            EndTime = s.EndTime,
            WeekDay = s.WeekDay
        }).ToList();

        return new GetSchedulesByClassSectionIdIntegrationResponse(scheduleDtos);
    }
}