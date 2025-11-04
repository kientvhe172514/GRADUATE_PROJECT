using MassTransit;

namespace Zentry.Infrastructure.Messaging.Heartbeat;

/// <summary>
///     Extension để đăng ký heartbeat consumer
/// </summary>
public static class HeartbeatConsumerExtensions
{
    public static void AddHeartbeatConsumer(this IBusRegistrationConfigurator configurator)
    {
        configurator.AddConsumer<HeartbeatConsumer>();
    }

    public static void ConfigureHeartbeatEndpoint(this IRabbitMqBusFactoryConfigurator cfg,
        IBusRegistrationContext context)
    {
        cfg.ReceiveEndpoint("heartbeat_queue", e =>
        {
            e.Durable = true;
            e.AutoDelete = false;
            e.ExclusiveConsumer = false; // ✅ FIX: Không dùng exclusive để nhiều pods có thể cùng consume
            e.PrefetchCount = 1;
            e.ConcurrentMessageLimit = 1;
            e.ConfigureConsumer<HeartbeatConsumer>(context);
        });
    }
}