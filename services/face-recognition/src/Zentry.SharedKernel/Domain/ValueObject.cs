using Zentry.SharedKernel.Abstractions.Domain;

namespace Zentry.SharedKernel.Domain;

public abstract class ValueObject : IValueObject
{
    protected abstract IEnumerable<object> GetEqualityComponents();

    public override bool Equals(object? obj)
    {
        if (obj == null || obj.GetType() != GetType()) return false;

        var other = (ValueObject)obj;
        return GetEqualityComponents().SequenceEqual(other.GetEqualityComponents());
    }

    public override int GetHashCode()
    {
        return GetEqualityComponents()
            .Aggregate(17, (current, obj) => current * 23 + (obj?.GetHashCode() ?? 0));
    }
}