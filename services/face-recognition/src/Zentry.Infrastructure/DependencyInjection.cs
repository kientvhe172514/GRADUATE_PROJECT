using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Serilog;
using StackExchange.Redis;
using Zentry.Infrastructure.Caching;
using Zentry.Infrastructure.Logging;
using Zentry.Infrastructure.Security.Encryption;
using Zentry.Infrastructure.Services;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        Log.Logger = new LoggerConfiguration()
            .Enrich.FromLogContext()
            .WriteTo.Console(
                outputTemplate:
                "[{Timestamp:yyyy-MM-dd HH:mm:ss}] [{Level:u3}] [{Module}] {Message:lj}{NewLine}{Exception}")
            .WriteTo.File(
                "logs/zentry-.txt",
                rollingInterval: RollingInterval.Day,
                outputTemplate:
                "[{Timestamp:yyyy-MM-dd HH:mm:ss}] [{Level:u3}] [{Module}] {Message:lj}{NewLine}{Exception}")
            .CreateLogger();

        services.AddLogging(builder => builder.AddSerilog(dispose: true));

        services.AddScoped<ILoggingService, LoggingService>();

        var redisConnectionString = configuration.GetSection("Redis:ConnectionString").Value
                                    ?? throw new ArgumentNullException(nameof(Zentry),
                                        "Redis:ConnectionString is not configured in appsettings.json.");
        if (string.IsNullOrEmpty(redisConnectionString))
            throw new InvalidOperationException("RedisConnection string is not configured.");

        // Đăng ký IConnectionMultiplexer là Singleton (nên là một thể hiện duy nhất)
        services.AddSingleton<IConnectionMultiplexer>(sp =>
        {
            // Log thông tin kết nối Redis để debug
            var logger = sp.GetRequiredService<ILogger<ConnectionMultiplexer>>();
            logger.LogInformation("Connecting to Redis at: {ConnectionString}", redisConnectionString);
            return ConnectionMultiplexer.Connect(redisConnectionString);
        });

        // Đăng ký IRedisService, nó sẽ nhận IConnectionMultiplexer và ILogger từ DI
        services.AddScoped<IRedisService, RedisService>();

        // ✅ Đăng ký ISessionService
        services.AddScoped<ISessionService, RedisSessionService>();

        // ✅ Đăng ký IRateLimitingService
        services.AddScoped<IRateLimitingService, RateLimitingService>();

        // Encryption service for FaceId embeddings
        services.AddSingleton<DataProtectionService>();

        return services;
    }
}