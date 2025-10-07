using MassTransit;
using Microsoft.Extensions.Logging;

namespace Zentry.Infrastructure.Messaging.Heartbeat;

/// <summary>
///     Consumer để xử lý heartbeat messages (không làm gì, chỉ để maintain connection)
/// </summary>
public class HeartbeatConsumer(ILogger<HeartbeatConsumer> logger) : IConsumer<RabbitMqHeartbeatMessage>
{
    public Task Consume(ConsumeContext<RabbitMqHeartbeatMessage> context)
    {
        logger.LogDebug("Heartbeat received from {Source} at {Timestamp}",
            context.Message.Source, context.Message.Timestamp);
        return Task.CompletedTask;
    }
}