using MassTransit;

namespace Zentry.Infrastructure.Messaging.HealthCheck;

/// <summary>
///     Consumer để handle health check messages
/// </summary>
public class HealthCheckConsumer : IConsumer<HealthCheckMessage>
{
    public Task Consume(ConsumeContext<HealthCheckMessage> context)
    {
        // Không làm gì, chỉ consume để test connection
        return Task.CompletedTask;
    }
}