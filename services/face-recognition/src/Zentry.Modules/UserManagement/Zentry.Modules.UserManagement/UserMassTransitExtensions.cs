using MassTransit;
using Zentry.Modules.UserManagement.EventHandlers;

namespace Zentry.Modules.UserManagement;

public static class UserMassTransitExtensions
{
    public static void AddUserMassTransitConsumers(this IBusRegistrationConfigurator configurator)
    {
        configurator.AddConsumer<RequestUpdateDeviceConsumer>();
    }

    public static void ConfigureUserReceiveEndpoints(this IRabbitMqBusFactoryConfigurator cfg,
        IBusRegistrationContext context)
    {
        cfg.ReceiveEndpoint("user_scan_data_queue", e =>
        {
            e.ConfigureConsumer<RequestUpdateDeviceConsumer>(context);
            e.UseMessageRetry(r => r.Interval(3, TimeSpan.FromSeconds(10)));
        });
    }
}