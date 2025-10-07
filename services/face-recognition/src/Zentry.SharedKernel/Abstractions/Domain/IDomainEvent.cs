namespace Zentry.SharedKernel.Abstractions.Domain;

public interface IDomainEvent
{
    DateTime OccurredOn { get; }
}