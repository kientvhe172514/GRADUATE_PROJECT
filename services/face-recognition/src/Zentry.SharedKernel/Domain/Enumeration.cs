using System.Reflection;

namespace Zentry.SharedKernel.Domain;

public abstract class Enumeration(int id, string name) : IComparable
{
    public int Id { get; } = id;
    private string Name { get; } = name;

    public int CompareTo(object? obj)
    {
        if (obj is Enumeration other) return Id.CompareTo(other.Id);
        throw new ArgumentException("Object is not an Enumeration.");
    }

    public override string ToString()
    {
        return Name;
    }

    public static IEnumerable<T> GetAll<T>() where T : Enumeration
    {
        return typeof(T).GetFields(BindingFlags.Public | BindingFlags.Static | BindingFlags.DeclaredOnly)
            .Select(f => f.GetValue(null))
            .Cast<T>();
    }

    public override bool Equals(object? obj)
    {
        if (obj is Enumeration other) return Id == other.Id && Name == other.Name;
        return false;
    }

    public override int GetHashCode()
    {
        return HashCode.Combine(Id, Name);
    }

    public static T FromName<T>(string name) where T : Enumeration
    {
        var matchingItem =
            GetAll<T>().FirstOrDefault(item => item.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
        return matchingItem ??
               throw new InvalidOperationException($"'{name}' is not a valid name for type {typeof(T)}.");
    }

    public static T FromId<T>(int id) where T : Enumeration
    {
        var matchingItem = GetAll<T>().FirstOrDefault(item => item.Id == id);
        return matchingItem ?? throw new InvalidOperationException($"'{id}' is not a valid id for type {typeof(T)}.");
    }
}