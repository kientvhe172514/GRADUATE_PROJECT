using MassTransit;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Zentry.Infrastructure.Messaging.Heartbeat;

/// <summary>
///     Service để warm-up RabbitMQ connections và đảm bảo consumers ready
/// </summary>
public class RabbitMqWarmupService(IServiceProvider serviceProvider, ILogger<RabbitMqWarmupService> logger)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Đợi 30 giây để app khởi động xong
        await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
            try
            {
                using var scope = serviceProvider.CreateScope();
                var bus = scope.ServiceProvider.GetRequiredService<IBus>();

                // Warm-up connection bằng cách gửi một heartbeat message
                await WarmupConnections(bus);

                // Chạy mỗi 30 phút để maintain connections
                await Task.Delay(TimeSpan.FromMinutes(30), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                // Expected when cancellation token is triggered
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error during RabbitMQ warmup");
                // Retry sau 5 phút nếu có lỗi
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
    }

    private async Task WarmupConnections(IBus bus)
    {
        try
        {
            logger.LogInformation("Warming up RabbitMQ connections...");

            // Publish một test message để warm-up connections
            await bus.Publish(new RabbitMqHeartbeatMessage
            {
                Timestamp = DateTime.UtcNow,
                Source = "WarmupService"
            });

            logger.LogInformation("RabbitMQ connections warmed up successfully");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to warm up RabbitMQ connections");
        }
    }

    public override async Task StartAsync(CancellationToken cancellationToken)
    {
        logger.LogInformation("RabbitMQ Warmup Service starting...");
        await base.StartAsync(cancellationToken);
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        logger.LogInformation("RabbitMQ Warmup Service stopping...");
        await base.StopAsync(cancellationToken);
    }
}