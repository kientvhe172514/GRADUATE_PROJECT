namespace Zentry.SharedKernel.Exceptions;

/// <summary>
///     Represents an exception thrown when a resource with the given identifier already exists.
/// </summary>
public class ResourceAlreadyExistsException : BusinessLogicException
{
    public ResourceAlreadyExistsException(string resourceName, object identifier) : base(
        $"{resourceName} with identifier '{identifier}' already exists.")
    {
    }

    public ResourceAlreadyExistsException(string message) : base(message)
    {
    }

    public ResourceAlreadyExistsException(string message, Exception innerException) : base(message, innerException)
    {
    }
}