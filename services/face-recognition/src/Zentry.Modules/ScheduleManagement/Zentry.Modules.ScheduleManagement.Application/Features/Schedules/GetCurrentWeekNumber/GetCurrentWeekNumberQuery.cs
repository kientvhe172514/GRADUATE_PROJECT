using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Schedules.GetCurrentWeekNumber;

public record GetCurrentWeekNumberQuery(DateOnly Date)
    : IQuery<GetCurrentWeekNumberResponse>;

public class GetCurrentWeekNumberResponse
{
    public DateOnly QueryDate { get; set; }
    public DateOnly? EarliestStartDate { get; set; }
    public int? WeekNumber { get; set; }
    public bool IsInSession { get; set; }
    public string Message { get; set; } = string.Empty;
}