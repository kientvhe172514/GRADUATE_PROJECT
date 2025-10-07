using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Zentry.Modules.DeviceManagement.Abstractions;
using Zentry.Modules.DeviceManagement.Persistence;
using Zentry.Modules.DeviceManagement.Persistence.Repositories;
using Zentry.Modules.DeviceManagement.Services;

namespace Zentry.Modules.DeviceManagement;

public static class DependencyInjection
{
    public static IServiceCollection AddDeviceInfrastructure(this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<DeviceDbContext>(options =>
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly("Zentry.Modules.DeviceManagement")
            ));

        services.AddScoped<IDeviceRepository, DeviceRepository>();
        services.AddScoped<IUserDeviceService, UserDeviceService>();
        return services;
    }
}