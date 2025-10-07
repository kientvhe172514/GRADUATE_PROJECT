namespace Zentry.SharedKernel.Contracts.Events;

public record BatchedSessionFinalAttendanceMessage
{
    public Guid SessionId { get; init; }
    public DateTime ScheduledProcessTime { get; init; }
    public string BatchId { get; init; } = string.Empty;
    public DateTime Timestamp { get; init; } = DateTime.UtcNow;
}