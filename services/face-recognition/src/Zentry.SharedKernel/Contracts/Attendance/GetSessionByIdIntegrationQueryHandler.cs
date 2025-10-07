using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Attendance;

public record GetSessionByIdIntegrationQuery(
    Guid SessionId
) : IQuery<SessionByIdDto>;

public class SessionByIdDto
{
    public Guid Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }

    public bool IsEditable => Status == "Pending" || Status == "Active";
}