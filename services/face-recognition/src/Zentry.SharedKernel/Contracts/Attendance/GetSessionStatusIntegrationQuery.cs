using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Attendance;

public class GetSessionStatusIntegrationQuery : IQuery<SessionStatusDto>
{
    public Guid ScheduleId { get; set; }
    public DateOnly SessionDate { get; set; }
}

public class SessionStatusDto
{
    public string Status { get; set; } = string.Empty;
}