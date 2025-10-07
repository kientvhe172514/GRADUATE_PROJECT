namespace Zentry.SharedKernel.Exceptions;

/// <summary>
///     Represents an exception thrown when a user with the given identifier already exists.
/// </summary>
public class UserAlreadyExistsException : Exception
{
    public UserAlreadyExistsException(string identifier) : base($"User with identifier '{identifier}' already exists")
    {
    }

    public UserAlreadyExistsException(string message, Exception innerException) : base(message, innerException)
    {
    }
}