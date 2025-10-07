using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Zentry.Modules.ConfigurationManagement.Persistence;

public class ConfigurationDbContextFactory : IDesignTimeDbContextFactory<ConfigurationDbContext>
{
    public ConfigurationDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", false)
            .AddJsonFile("appsettings.Development.json", true)
            .AddEnvironmentVariables()
            .Build();

        var optionsBuilder = new DbContextOptionsBuilder<ConfigurationDbContext>();
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        if (string.IsNullOrEmpty(connectionString))
            // Fallback connection string for development
            connectionString = "Host=localhost;Database=ZentryDb;Username=postgres;Password=postgres";

        optionsBuilder.UseNpgsql(connectionString,
            b => b.MigrationsAssembly("Zentry.Modules.ConfigurationManagement"));

        return new ConfigurationDbContext(optionsBuilder.Options);
    }
}