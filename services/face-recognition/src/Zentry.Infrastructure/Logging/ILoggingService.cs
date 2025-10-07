namespace Zentry.Infrastructure.Logging;

public interface ILoggingService
{
    void LogInformation(string module, string message, params object[] args);
    void LogError(string module, string message, Exception exception = null, params object[] args);
}