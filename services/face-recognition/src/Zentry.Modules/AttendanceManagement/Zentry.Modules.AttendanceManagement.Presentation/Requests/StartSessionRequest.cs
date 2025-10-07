namespace Zentry.Modules.AttendanceManagement.Presentation.Requests;

public class StartSessionRequest
{
    // Bạn có thể không cần sessionId ở đây nếu nó được lấy từ route,
    // nhưng nếu bạn muốn nó là một phần của body thì giữ lại.
    // Với endpoint "sessions/{sessionId}/start", UserId là đủ trong body.
    public Guid UserId { get; set; }
}