using Zentry.SharedKernel.Abstractions.Domain;

namespace Zentry.SharedKernel.Domain;

public abstract class DomainEvent : IDomainEvent
{
    public DateTime OccurredOn { get; } = DateTime.UtcNow;
}