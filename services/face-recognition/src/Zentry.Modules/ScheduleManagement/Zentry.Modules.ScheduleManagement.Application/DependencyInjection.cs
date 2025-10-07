using Microsoft.Extensions.DependencyInjection;
using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.Modules.ScheduleManagement.Application.Services;
using Zentry.SharedKernel.Abstractions.Data;

namespace Zentry.Modules.ScheduleManagement.Application;

public static class DependencyCollection
{
    public static IServiceCollection AddScheduleApplication(this IServiceCollection services)
    {
        services.AddScoped<IUserScheduleService, UserScheduleService>();
        services.AddScoped<IAttendanceCalculationService, AttendanceCalculationService>();
        services.AddScoped<IFileProcessor<ScheduleImportDto>, ScheduleFileProcessor>();
        services.AddScoped<IFileProcessor<EnrollmentImportDto>, EnrollmentFileProcessor>();

        return services;
    }
}