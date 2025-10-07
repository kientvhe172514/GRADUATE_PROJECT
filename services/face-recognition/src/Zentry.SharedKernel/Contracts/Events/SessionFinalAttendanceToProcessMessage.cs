namespace Zentry.SharedKernel.Contracts.Events;

public class SessionFinalAttendanceToProcessMessage
{
    public Guid SessionId { get; set; }
    public int ActualRoundsCount { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}