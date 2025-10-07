using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Schedule;

public record GetSessionsByScheduleIdsAndDatesIntegrationQuery(List<ScheduleDateLookup> Lookups)
    : IQuery<List<GetSessionsByScheduleIdAndDateIntegrationResponse>>;

public class GetSessionsByScheduleIdAndDateIntegrationResponse
{
    public Guid ScheduleId { get; set; }
    public Guid SessionId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
}

public record ScheduleDateLookup(Guid ScheduleId, DateOnly Date);