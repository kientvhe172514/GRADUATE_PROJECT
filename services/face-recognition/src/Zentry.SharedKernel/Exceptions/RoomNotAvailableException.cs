namespace Zentry.SharedKernel.Exceptions;

/// <summary>
///     Represents an exception thrown when a room is not available at a specific time.
/// </summary>
public class RoomNotAvailableException : BusinessLogicException
{
    public RoomNotAvailableException(string roomId, DateTime dateTime) : base(
        $"Room '{roomId}' is not available at {dateTime.ToString("g")}.")
    {
    }

    public RoomNotAvailableException(string message) : base(message)
    {
    }

    public RoomNotAvailableException(string message, Exception innerException) : base(message, innerException)
    {
    }
}