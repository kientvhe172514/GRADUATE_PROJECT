namespace Zentry.SharedKernel.Exceptions;

/// <summary>
///     Represents an exception thrown when attendance calculation fails.
/// </summary>
public class AttendanceCalculationFailedException : BusinessLogicException
{
    public AttendanceCalculationFailedException(string message) : base(message)
    {
    }

    public AttendanceCalculationFailedException(string message, Exception innerException) : base(message,
        innerException)
    {
    }
}