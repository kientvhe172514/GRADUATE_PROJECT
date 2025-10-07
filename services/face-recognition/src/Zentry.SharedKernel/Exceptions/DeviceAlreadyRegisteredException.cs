namespace Zentry.SharedKernel.Exceptions;

/// <summary>
///     Represents an exception thrown when a device is already registered.
/// </summary>
public class DeviceAlreadyRegisteredException : Exception
{
    public DeviceAlreadyRegisteredException(string deviceId) : base(
        $"Device with ID '{deviceId}' is already registered")
    {
    }

    public DeviceAlreadyRegisteredException(string message, Exception innerException) : base(message, innerException)
    {
    }
}