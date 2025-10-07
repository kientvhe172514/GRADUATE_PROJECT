using MassTransit;
using Zentry.Modules.NotificationService.Application.EventHandlers;

namespace Zentry.Modules.NotificationService;

public static class NotificationMassTransitExtensions
{
    public static void AddNotificationMassTransitConsumers(this IBusRegistrationConfigurator configurator)
    {
        configurator.AddConsumer<NotificationCreatedConsumer>();
    }

    public static void ConfigureNotificationReceiveEndpoints(this IRabbitMqBusFactoryConfigurator cfg,
        IBusRegistrationContext context)
    {
        cfg.ReceiveEndpoint("notification_queue", e =>
        {
            e.ConfigureConsumer<NotificationCreatedConsumer>(context);
            e.UseMessageRetry(r => r.Interval(3, TimeSpan.FromSeconds(10)));
        });
    }
}