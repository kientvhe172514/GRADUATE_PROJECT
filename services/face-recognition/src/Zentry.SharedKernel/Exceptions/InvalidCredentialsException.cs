namespace Zentry.SharedKernel.Exceptions;

/// <summary>
///     Represents an exception thrown when provided credentials are invalid.
/// </summary>
public class InvalidCredentialsException : BusinessLogicException
{
    public InvalidCredentialsException() : base("Invalid credentials.")
    {
    }

    public InvalidCredentialsException(string message) : base(message)
    {
    }

    public InvalidCredentialsException(string message, Exception innerException) : base(message, innerException)
    {
    }
}