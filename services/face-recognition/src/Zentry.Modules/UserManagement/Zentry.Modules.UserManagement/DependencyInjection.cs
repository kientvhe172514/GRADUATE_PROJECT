using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Zentry.Modules.UserManagement.Dtos;
using Zentry.Modules.UserManagement.Interfaces;
using Zentry.Modules.UserManagement.Persistence.DbContext;
using Zentry.Modules.UserManagement.Persistence.Repositories;
using Zentry.Modules.UserManagement.Services;
using Zentry.SharedKernel.Abstractions.Data;

namespace Zentry.Modules.UserManagement;

public static class DependencyInjection
{
    public static IServiceCollection AddUserInfrastructure(this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IUserRequestRepository, UserRequestRepository>();
        services.AddDbContext<UserDbContext>(options =>
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly("Zentry.Modules.UserManagement")
            ));

        services.AddTransient<IJwtService, JwtService>();

        services.AddTransient<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IFileProcessor<UserImportDto>, UserFileProcessor>();
        return services;
    }
}