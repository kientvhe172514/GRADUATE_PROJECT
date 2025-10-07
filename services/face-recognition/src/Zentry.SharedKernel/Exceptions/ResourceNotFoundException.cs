namespace Zentry.SharedKernel.Exceptions;

/// <summary>
///     Represents an exception thrown when a specific resource is not found.
/// </summary>
public class ResourceNotFoundException : BusinessLogicException
{
    public ResourceNotFoundException(string resourceName, object id) : base($"{resourceName} with ID '{id}' not found.")
    {
    }

    public ResourceNotFoundException(string message) : base(message)
    {
    }

    public ResourceNotFoundException(string message, Exception innerException) : base(message, innerException)
    {
    }
}