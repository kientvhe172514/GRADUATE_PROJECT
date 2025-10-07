namespace Zentry.SharedKernel.Contracts.Events;

public record CalculateRoundAttendanceMessage
{
    public Guid SessionId { get; init; }
    public Guid RoundId { get; init; }
    public bool IsFinalRound { get; init; }
    public int TotalRounds { get; init; }
}