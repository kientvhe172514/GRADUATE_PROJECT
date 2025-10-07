namespace Zentry.SharedKernel.Exceptions;

/// <summary>
///     Represents an exception thrown when a user is not found.
/// </summary>
public class UserNotFoundException : BusinessLogicException
{
    public UserNotFoundException(Guid userId) : base($"User with ID '{userId}' not found.")
    {
    }

    public UserNotFoundException(string message) : base(message)
    {
    }

    public UserNotFoundException(string message, Exception innerException) : base(message, innerException)
    {
    }
}