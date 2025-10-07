using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Attendance;

public record GetSessionByScheduleIdAndDateIntegrationQuery(Guid ScheduleId, DateOnly Date)
    : IQuery<GetSessionByScheduleIdAndDateIntegrationResponse>;

public class GetSessionByScheduleIdAndDateIntegrationResponse
{
    public Guid SessionId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime StartTime { get; set; } // Giữ DateTime ở đây (UTC)
    public DateTime EndTime { get; set; } // Giữ DateTime ở đây (UTC)
}