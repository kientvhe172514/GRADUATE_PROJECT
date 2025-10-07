using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Zentry.Modules.FaceId.Interfaces;
using Zentry.Modules.FaceId.Persistence;
using Zentry.Modules.FaceId.Persistence.Repositories;

namespace Zentry.Modules.FaceId;

public static class DependencyInjection
{
    public static IServiceCollection AddFaceIdInfrastructure(this IServiceCollection services,
        IConfiguration configuration)
    {
        // Register DbContext
        services.AddDbContext<FaceIdDbContext>(options =>
            // Sử dụng chuỗi kết nối FaceIdConnection
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection"),
                b =>
                {
                    b.MigrationsAssembly("Zentry.Modules.FaceId");
                    b.EnableRetryOnFailure(5);
                    // Enable pgvector extension
                    b.UseVector();
                }
            ).ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning)));

        // Register repositories
        services.AddScoped<IFaceIdRepository, FaceIdRepository>();

        // Register MediatR handlers
        services.AddMediatR(cfg =>
            cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));
        return services;
    }
}