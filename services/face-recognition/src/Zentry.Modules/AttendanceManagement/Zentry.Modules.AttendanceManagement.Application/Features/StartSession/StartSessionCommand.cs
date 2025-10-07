using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Attendance;

namespace Zentry.Modules.AttendanceManagement.Application.Features.StartSession;

public class StartSessionCommand : ICommand<StartSessionResponse>
{
    public Guid SessionId { get; set; }
    public Guid LecturerId { get; set; }
}

public class StartSessionResponse
{
    public Guid SessionId { get; set; }
    public Guid ScheduleId { get; set; }
    public Guid? LecturerId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public DateTime CreatedAt { get; set; }
    public SessionStatus Status { get; set; }
}