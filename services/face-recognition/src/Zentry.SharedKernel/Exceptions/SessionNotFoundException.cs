namespace Zentry.SharedKernel.Exceptions;

/// <summary>
///     Represents an exception thrown when an attendance session is not found.
/// </summary>
public class SessionNotFoundException : BusinessLogicException
{
    public SessionNotFoundException(Guid sessionId) : base($"Session with ID '{sessionId}' not found.")
    {
    }

    public SessionNotFoundException(string message) : base(message)
    {
    }

    public SessionNotFoundException(string message, Exception innerException) : base(message, innerException)
    {
    }
}