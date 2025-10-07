namespace Zentry.SharedKernel.Exceptions;

/// <summary>
///     Represents an exception thrown when an attendance session has already started.
/// </summary>
public class SessionAlreadyStartedException : BusinessLogicException
{
    public SessionAlreadyStartedException(Guid sessionId) : base($"Session with ID '{sessionId}' has already started.")
    {
    }

    public SessionAlreadyStartedException(string message) : base(message)
    {
    }

    public SessionAlreadyStartedException(string message, Exception innerException) : base(message, innerException)
    {
    }
}