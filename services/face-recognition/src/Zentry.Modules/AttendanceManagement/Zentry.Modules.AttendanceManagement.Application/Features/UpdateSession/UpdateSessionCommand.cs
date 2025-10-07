using Zentry.Modules.AttendanceManagement.Domain.ValueObjects;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Attendance;

namespace Zentry.Modules.AttendanceManagement.Application.Features.UpdateSession;

public class UpdateSessionCommand : ICommand<UpdateSessionResponse>
{
    public Guid SessionId { get; set; }
    public Guid? LecturerId { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public Dictionary<string, string>? SessionConfigs { get; set; }
}

public class UpdateSessionResponse
{
    public Guid SessionId { get; set; }
    public Guid ScheduleId { get; set; }
    public Guid? LecturerId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public SessionStatus Status { get; set; }
    public SessionConfigSnapshot SessionConfigs { get; set; }
}