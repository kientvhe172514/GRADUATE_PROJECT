using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Zentry.Modules.DeviceManagement.Persistence;

public class DeviceManagementDbContextFactory : IDesignTimeDbContextFactory<DeviceDbContext>
{
    public DeviceDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", false)
            .AddJsonFile("appsettings.Development.json", true)
            .AddEnvironmentVariables()
            .Build();

        var optionsBuilder = new DbContextOptionsBuilder<DeviceDbContext>();
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        if (string.IsNullOrEmpty(connectionString))
            // Fallback connection string for development
            connectionString = "Host=localhost;Database=ZentryDb;Username=postgres;Password=postgres";

        optionsBuilder.UseNpgsql(connectionString,
            b => b.MigrationsAssembly("Zentry.Modules.DeviceManagement"));

        return new DeviceDbContext(optionsBuilder.Options);
    }
}