using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Zentry.Modules.ConfigurationManagement.Abstractions;
using Zentry.Modules.ConfigurationManagement.Persistence;
using Zentry.Modules.ConfigurationManagement.Services;

// Thêm using này
// Thêm using này

namespace Zentry.Modules.ConfigurationManagement;

public static class DependencyInjection
{
    public static IServiceCollection AddConfigurationInfrastructure(this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<ConfigurationDbContext>(options =>
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly("Zentry.Modules.ConfigurationManagement")
            ));

        services.AddScoped<IAttributeService, AttributeService>();
        return services;
    }

    public static async Task UseConfigurationDbSeed(this IHost host)
    {
        using var scope = host.Services.CreateScope();
        var services = scope.ServiceProvider;
        var logger = services.GetRequiredService<ILogger<ConfigurationDbContext>>();

        try
        {
            var context = services.GetRequiredService<ConfigurationDbContext>();
            await context.Database.MigrateAsync();
            await ConfigurationDbContext.SeedDataAsync(context, logger);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while seeding the Configuration database.");
            throw;
        }
    }
}