using MassTransit;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using RabbitMQ.Client;

namespace Zentry.Infrastructure.Messaging.HealthCheck;

/// <summary>
///     Extension methods để đăng ký health checks
/// </summary>
public static class HealthCheckExtensions
{
    public static IServiceCollection AddRabbitMqHealthChecks(this IServiceCollection services,
        string connectionString)
    {
        // Đăng ký ConnectionFactory cho health check
        services.AddSingleton<IConnectionFactory>(provider =>
        {
            var factory = new ConnectionFactory
            {
                Uri = new Uri(connectionString),
                AutomaticRecoveryEnabled = true,
                NetworkRecoveryInterval = TimeSpan.FromSeconds(10),
                RequestedHeartbeat = TimeSpan.FromSeconds(30)
            };

            return factory;
        });

        // Đăng ký health checks
        services.AddHealthChecks()
            .AddCheck<RabbitMqHealthCheck>("rabbitmq",
                HealthStatus.Unhealthy,
                new[] { "ready", "rabbitmq" })
            .AddCheck<MassTransitHealthCheck>("masstransit",
                HealthStatus.Unhealthy,
                new[] { "ready", "masstransit" });

        return services;
    }

    public static void AddHealthCheckConsumer(this IBusRegistrationConfigurator configurator)
    {
        configurator.AddConsumer<HealthCheckConsumer>();
    }

    public static void ConfigureHealthCheckEndpoint(this IRabbitMqBusFactoryConfigurator cfg,
        IBusRegistrationContext context)
    {
        cfg.ReceiveEndpoint("health_check_queue", e =>
        {
            e.Durable = false;
            e.AutoDelete = true;
            e.PrefetchCount = 1;
            e.ConcurrentMessageLimit = 1;
            e.ConfigureConsumer<HealthCheckConsumer>(context);
        });
    }
}