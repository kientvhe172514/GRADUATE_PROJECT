namespace Zentry.SharedKernel.Exceptions;

/// <summary>
///     Represents a general exception related to configuration issues.
/// </summary>
public class ConfigurationException : BusinessLogicException
{
    public ConfigurationException(string message) : base(message)
    {
    }

    public ConfigurationException(string message, Exception innerException) : base(message, innerException)
    {
    }
}