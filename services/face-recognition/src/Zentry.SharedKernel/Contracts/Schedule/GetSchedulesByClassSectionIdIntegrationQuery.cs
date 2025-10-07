using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Schedule;

namespace Zentry.SharedKernel.Contracts.Schedule;

public record GetSchedulesByClassSectionIdIntegrationQuery(Guid ClassSectionId)
    : IQuery<GetSchedulesByClassSectionIdIntegrationResponse>;

public record GetSchedulesByClassSectionIdIntegrationResponse(List<ScheduleInfoDto> Schedules);

public record ScheduleInfoDto
{
    public Guid ScheduleId { get; init; }
    public Guid RoomId { get; init; }
    public DateOnly StartDate { get; init; }
    public DateOnly EndDate { get; init; }
    public TimeOnly StartTime { get; init; }
    public TimeOnly EndTime { get; init; }
    public WeekDayEnum WeekDay { get; init; }
}