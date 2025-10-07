using Zentry.SharedKernel.Abstractions.Domain;

namespace Zentry.SharedKernel.Domain;

// Lớp Entity giờ đây là generic để chấp nhận bất kỳ kiểu Id nào
public abstract class Entity<TId>(TId id) : IEntity<TId>
    where TId : notnull // Đảm bảo TId không null
{
    // Thuộc tính Id giờ có kiểu TId
    public TId Id { get; } = id ?? throw new ArgumentNullException(nameof(id));

    public override bool Equals(object? obj)
    {
        // Kiểm tra xem Id có phải là kiểu giá trị và có giá trị mặc định không
        if (typeof(TId).IsValueType && EqualityComparer<TId>.Default.Equals(Id, default!))
            return ReferenceEquals(this, obj); // Nếu Id là default cho kiểu giá trị, so sánh tham chiếu

        if (obj is Entity<TId> other) return EqualityComparer<TId>.Default.Equals(Id, other.Id);
        return false;
    }

    public override int GetHashCode()
    {
        // Xử lý trường hợp Id là default cho kiểu giá trị (ví dụ Guid.Empty)
        if (typeof(TId).IsValueType &&
            EqualityComparer<TId>.Default.Equals(Id, default!))
            return base.GetHashCode(); // Sử dụng GetHashCode của object
        return Id.GetHashCode();
    }

    public static bool operator ==(Entity<TId> left, Entity<TId>? right)
    {
        if (ReferenceEquals(left, null)) return ReferenceEquals(right, null);
        return left.Equals(right);
    }

    public static bool operator !=(Entity<TId> left, Entity<TId> right)
    {
        return !(left == right);
    }
}