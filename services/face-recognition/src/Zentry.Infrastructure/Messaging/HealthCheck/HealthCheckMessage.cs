namespace Zentry.Infrastructure.Messaging.HealthCheck;

/// <summary>
///     Message để test health check
/// </summary>
public record HealthCheckMessage
{
    public DateTime Timestamp { get; init; }
}