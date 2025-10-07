namespace Zentry.Infrastructure.Messaging.Heartbeat;

/// <summary>
///     Message để test connection
/// </summary>
public record RabbitMqHeartbeatMessage
{
    public DateTime Timestamp { get; init; }
    public string Source { get; init; } = string.Empty;
}