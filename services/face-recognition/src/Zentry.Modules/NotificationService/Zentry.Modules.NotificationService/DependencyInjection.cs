using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Zentry.Modules.NotificationService.Application.Services;
using Zentry.Modules.NotificationService.Infrastructure.DeviceTokens;
using Zentry.Modules.NotificationService.Infrastructure.Push;
using Zentry.Modules.NotificationService.Infrastructure.Services;
using Zentry.Modules.NotificationService.Persistence;
using Zentry.Modules.NotificationService.Persistence.Repository;
using Zentry.Modules.NotificationService.Services;

namespace Zentry.Modules.NotificationService;

public static class DependencyInjection
{
    public static IServiceCollection AddNotificationModule(this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<NotificationDbContext>(options =>
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly("Zentry.Modules.NotificationService")));

        services.AddMediatR(cfg =>
            cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));

        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<IDeviceTokenRepository, DeviceTokenRepository>();
        services.AddScoped<IFcmSender, FcmSender>();
        services.AddScoped<INotificationSender, NotificationSender>();

        // Mock service để test FCM token registration
        // TODO: Thay thế bằng DeviceManagement integration thực tế
        services.AddScoped<IDeviceManagementService, MockDeviceManagementService>();

        services.AddSignalR();

        return services;
    }
}