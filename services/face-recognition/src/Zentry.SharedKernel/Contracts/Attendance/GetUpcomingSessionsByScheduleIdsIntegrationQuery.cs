using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Attendance;

public record GetUpcomingSessionsByScheduleIdsIntegrationQuery(List<Guid> ScheduleIds)
    : IQuery<GetUpcomingSessionsByScheduleIdsIntegrationResponse>;

// Response mới
public record GetUpcomingSessionsByScheduleIdsIntegrationResponse(List<UpcomingSessionDto> Sessions);

public record UpcomingSessionDto
{
    public Guid Id { get; set; }
    public Guid ScheduleId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
}