using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Zentry.Modules.FaceId.Persistence;

public class FaceIdDbContextFactory : IDesignTimeDbContextFactory<FaceIdDbContext>
{
    public FaceIdDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", false)
            .AddJsonFile("appsettings.Development.json", true)
            .AddEnvironmentVariables()
            .Build();

        var optionsBuilder = new DbContextOptionsBuilder<FaceIdDbContext>();
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        if (string.IsNullOrEmpty(connectionString))
            // Fallback connection string for development
            connectionString = "Host=localhost;Database=ZentryDb;Username=postgres;Password=postgres";

        optionsBuilder.UseNpgsql(connectionString,
            b =>
            {
                b.MigrationsAssembly("Zentry.Modules.FaceId");
                b.EnableRetryOnFailure(5);
                // Enable pgvector extension
                b.UseVector();
            });

        return new FaceIdDbContext(optionsBuilder.Options);
    }
}