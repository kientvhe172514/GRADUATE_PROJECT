using Marten;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Serializers;
using MongoDB.Driver;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.Modules.AttendanceManagement.Domain.Entities;
using Zentry.Modules.AttendanceManagement.Infrastructure.Persistence;
using Zentry.Modules.AttendanceManagement.Infrastructure.Repositories;

namespace Zentry.Modules.AttendanceManagement.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddAttendanceInfrastructure(this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<AttendanceDbContext>(options =>
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly("Zentry.Modules.AttendanceManagement.Infrastructure")
            ));

        // var useMarten = configuration.GetValue<bool>("UseMarten", true);
        var useMarten = true;
        if (useMarten)
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection") ??
                                   throw new InvalidOperationException("DefaultConnection is not configured.");

            services.AddMarten(options =>
            {
                options.Connection(connectionString);
                options.Schema.For<ScanLog>().Identity(r => r.Id);
                options.Schema.For<ScheduleWhitelist>()
                    .Index(x => x.ScheduleId, x => x.IsUnique = true);
                options.Schema.For<StudentTrack>().Identity(x => x.Id)
                    .Index(x => x.StudentId)
                    .Index(x => x.SessionId);
            });

            services.AddScoped<IScanLogRepository, MartenScanLogRepository>();
            services.AddScoped<IScheduleWhitelistRepository, MartenScheduleWhitelistRepository>();
            services.AddScoped<IStudentTrackRepository, MartenStudentTrackRepository>();
            services.AddScoped<IRoundTrackRepository, MartenRoundTrackRepository>();
        }
        else
        {
            var mongoConnectionString = configuration["MongoDB:ConnectionString"] ??
                                        throw new InvalidOperationException(
                                            "MongoDB__ConnectionString is not configured.");
            BsonSerializer.RegisterSerializer(new GuidSerializer(GuidRepresentation.Standard));
            services.AddSingleton<IMongoClient>(s =>
            {
                var settings = MongoClientSettings.FromConnectionString(mongoConnectionString);
                settings.RetryWrites = true;
                settings.ConnectTimeout = TimeSpan.FromSeconds(30);
                settings.ServerSelectionTimeout = TimeSpan.FromSeconds(30);
                return new MongoClient(settings);
            });

            services.AddSingleton(s =>
            {
                var mongoClient = s.GetRequiredService<IMongoClient>();
                return mongoClient.GetDatabase("zentry");
            });

            services.AddScoped<IScanLogRepository, MongoScanLogRepository>();
        }

        services.AddScoped<IAttendanceRecordRepository, AttendanceRecordRepository>();
        services.AddScoped<ISessionRepository, SessionRepository>();
        services.AddScoped<IRoundRepository, RoundRepository>();
        services.AddMediatR(cfg =>
            cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));

        return services;
    }
}