namespace Zentry.Modules.AttendanceManagement.Application.Features.UpdateSession;

public class UpdateSessionRequest
{
    public Guid? LecturerId { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public Dictionary<string, string>? SessionConfigs { get; set; }
}