using Microsoft.Extensions.Logging;

namespace Zentry.Infrastructure.Logging;

public class LoggingService(ILogger<LoggingService> logger) : ILoggingService
{
    public void LogInformation(string module, string message, params object[] args)
    {
        logger.LogInformation($"[{module}] {message}", args);
    }

    public void LogError(string module, string message, Exception exception = null, params object[] args)
    {
        logger.LogError(exception, $"[{module}] {message}", args);
    }
}