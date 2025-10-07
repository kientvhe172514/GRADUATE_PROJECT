using Microsoft.Extensions.DependencyInjection;
using Zentry.Modules.AttendanceManagement.Application.Services;
using Zentry.Modules.AttendanceManagement.Application.Services.Interface;

namespace Zentry.Modules.AttendanceManagement.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddAttendanceApplication(this IServiceCollection services)
    {
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IConfigurationService, ConfigurationService>();
        services.AddScoped<IScheduleService, ScheduleService>();
        services.AddScoped<IAttendanceCalculationService, AttendanceCalculationService>();
        services.AddScoped<IAttendancePersistenceService, AttendancePersistenceService>();

        return services;
    }
}