namespace Zentry.SharedKernel.Exceptions;

/// <summary>
///     Represents an exception thrown when an authentication token has expired.
/// </summary>
public class TokenExpiredException : BusinessLogicException
{
    public TokenExpiredException() : base("Token expired.")
    {
    }

    public TokenExpiredException(string message) : base(message)
    {
    }

    public TokenExpiredException(string message, Exception innerException) : base(message, innerException)
    {
    }
}