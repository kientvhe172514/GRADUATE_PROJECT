using MediatR;
using Zentry.Modules.AttendanceManagement.Application.Services.Interface;
using Zentry.SharedKernel.Contracts.Schedule;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.AttendanceManagement.Application.Services;

public class ScheduleService(IMediator mediator) : IScheduleService
{
    public Task<GetScheduleByIdIntegrationResponse> GetScheduleByIdAsync(Guid scheduleId,
        CancellationToken cancellationToken)
    {
        try
        {
            var query = new GetScheduleByIdIntegrationQuery(scheduleId);
            return mediator.Send(query, cancellationToken);
        }
        catch (Exception e)
        {
            throw new BusinessRuleException("SCHEDULE_INVALID",
                "Lịch trình buổi học không hợp lệ hoặc không hoạt động.");
        }
    }
}