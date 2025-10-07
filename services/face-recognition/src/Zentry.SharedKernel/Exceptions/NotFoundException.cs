namespace Zentry.SharedKernel.Exceptions;

/// <summary>
///     Represents a general exception thrown when an entity is not found by its key.
///     This can be used as a more generic alternative to specific "NotFound" exceptions.
/// </summary>
public class NotFoundException : BusinessLogicException
{
    public NotFoundException(string name, object key) : base($"Entity \"{name}\" ({key}) was not found.")
    {
    }

    public NotFoundException(string message) : base(message)
    {
    }

    public NotFoundException(string message, Exception innerException) : base(message, innerException)
    {
    }
}