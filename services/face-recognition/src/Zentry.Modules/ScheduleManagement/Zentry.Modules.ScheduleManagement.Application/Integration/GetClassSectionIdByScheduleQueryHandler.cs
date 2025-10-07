using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Schedule;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ScheduleManagement.Application.Integration;

public class GetClassSectionIdByScheduleQueryHandler(IScheduleRepository scheduleRepository)
    : IQueryHandler<GetClassSectionIdByScheduleIdIntegrationQuery, GetClassSectionIdByScheduleIdIntegrationResponse>
{
    public async Task<GetClassSectionIdByScheduleIdIntegrationResponse> Handle(
        GetClassSectionIdByScheduleIdIntegrationQuery request,
        CancellationToken cancellationToken)
    {
        var schedule =
            await scheduleRepository.GetByIdAsync(request.ScheduleId, cancellationToken);

        if (schedule is null) throw new NotFoundException("Schedule", request.ScheduleId);

        return new GetClassSectionIdByScheduleIdIntegrationResponse(schedule.ClassSectionId);
    }
}