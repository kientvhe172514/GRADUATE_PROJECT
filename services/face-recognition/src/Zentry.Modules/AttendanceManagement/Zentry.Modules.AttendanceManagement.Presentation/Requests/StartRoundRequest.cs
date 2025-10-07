namespace Zentry.Modules.AttendanceManagement.Presentation.Requests;

public class StartRoundRequest
{
    public Guid LecturerId { get; set; }
    public bool RequireFaceVerification { get; set; } = true;
}