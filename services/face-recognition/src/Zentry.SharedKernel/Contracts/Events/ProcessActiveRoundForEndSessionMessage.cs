namespace Zentry.SharedKernel.Contracts.Events;

public record ProcessActiveRoundForEndSessionMessage
{
    public Guid SessionId { get; init; }
    public Guid ActiveRoundId { get; init; }
    public Guid UserId { get; init; }
    public List<Guid> PendingRoundIds { get; init; } = [];
}