using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging;
using RabbitMQ.Client;

namespace Zentry.Infrastructure.Messaging.HealthCheck;

/// <summary>
///     Health check cho RabbitMQ connection
/// </summary>
public class RabbitMqHealthCheck(IConnectionFactory connectionFactory, ILogger<RabbitMqHealthCheck> logger)
    : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await using var connection = await connectionFactory.CreateConnectionAsync(cancellationToken);
            await using var channel = await connection.CreateChannelAsync(cancellationToken: cancellationToken);

            if (connection.IsOpen && channel.IsOpen)
            {
                logger.LogDebug("RabbitMQ health check passed");
                return HealthCheckResult.Healthy("RabbitMQ connection is healthy");
            }

            logger.LogWarning("RabbitMQ connection or channel is not open");
            return HealthCheckResult.Unhealthy("RabbitMQ connection or channel is not open");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "RabbitMQ health check failed");
            return HealthCheckResult.Unhealthy($"RabbitMQ health check failed: {ex.Message}");
        }
    }
}