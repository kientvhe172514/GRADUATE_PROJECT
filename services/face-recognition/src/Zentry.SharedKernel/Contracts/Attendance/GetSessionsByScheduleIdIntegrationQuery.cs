using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Attendance;

public record GetSessionsByScheduleIdIntegrationQuery(Guid ScheduleId)
    : IQuery<List<GetSessionsByScheduleIdIntegrationResponse>>;

public class GetSessionsByScheduleIdIntegrationResponse
{
    public Guid SessionId { get; set; }
    public Guid ScheduleId { get; set; }
    public required string Status { get; set; }
    public DateTime StartTime { get; set; }

    public DateTime EndTime { get; set; }
}