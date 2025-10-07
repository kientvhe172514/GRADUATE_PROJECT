namespace Zentry.SharedKernel.Exceptions;

/// <summary>
///     Represents an exception thrown when a schedule conflict occurs.
/// </summary>
public class ScheduleConflictException : BusinessLogicException
{
    public ScheduleConflictException(string message) : base(message)
    {
    }

    public ScheduleConflictException(string message, Exception innerException) : base(message, innerException)
    {
    }
}