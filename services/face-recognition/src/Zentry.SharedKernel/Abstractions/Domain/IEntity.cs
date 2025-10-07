namespace Zentry.SharedKernel.Abstractions.Domain;

// IEntity giờ đây là generic
public interface IEntity<TId>
    where TId : notnull // Đảm bảo TId không null
{
    TId Id { get; }
}