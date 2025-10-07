using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Zentry.Modules.AttendanceManagement.Infrastructure.Persistence;

public class AttendanceDbContextFactory : IDesignTimeDbContextFactory<AttendanceDbContext>
{
    public AttendanceDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", false)
            .AddJsonFile("appsettings.Development.json", true)
            .AddEnvironmentVariables()
            .Build();

        var optionsBuilder = new DbContextOptionsBuilder<AttendanceDbContext>();
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        if (string.IsNullOrEmpty(connectionString))
            // Fallback connection string for development
            connectionString = "Host=localhost;Database=ZentryDb;Username=postgres;Password=postgres";

        optionsBuilder.UseNpgsql(connectionString,
            b => b.MigrationsAssembly("Zentry.Modules.AttendanceManagement.Infrastructure"));

        return new AttendanceDbContext(optionsBuilder.Options);
    }
}