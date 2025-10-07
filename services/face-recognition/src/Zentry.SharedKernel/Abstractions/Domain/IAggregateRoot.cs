namespace Zentry.SharedKernel.Abstractions.Domain;

public interface IAggregateRoot<TId> : IEntity<TId>
    where TId : notnull // Đảm bảo TId không null
{
}