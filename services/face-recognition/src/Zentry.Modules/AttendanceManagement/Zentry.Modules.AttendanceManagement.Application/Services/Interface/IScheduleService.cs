using Zentry.SharedKernel.Contracts.Schedule;

namespace Zentry.Modules.AttendanceManagement.Application.Services.Interface;

public interface IScheduleService
{
    Task<GetScheduleByIdIntegrationResponse>
        GetScheduleByIdAsync(Guid scheduleId, CancellationToken cancellationToken);
}