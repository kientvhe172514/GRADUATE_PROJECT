using MassTransit;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging;

namespace Zentry.Infrastructure.Messaging.HealthCheck;

/// <summary>
///     Health check cho MassTransit bus
/// </summary>
public class MassTransitHealthCheck(IBus bus, ILogger<MassTransitHealthCheck> logger) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Test bus bằng cách gửi một message test
            await bus.Publish(new HealthCheckMessage { Timestamp = DateTime.UtcNow }, cancellationToken);

            logger.LogDebug("MassTransit health check passed");
            return HealthCheckResult.Healthy("MassTransit bus is healthy");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "MassTransit health check failed");
            return HealthCheckResult.Unhealthy($"MassTransit health check failed: {ex.Message}");
        }
    }
}