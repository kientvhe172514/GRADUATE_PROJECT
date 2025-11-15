using MassTransit;
using Zentry.Modules.FaceId.Features.VerifyFaceForAttendance;

namespace Zentry.Modules.FaceId;

/// <summary>
/// MassTransit configuration for FaceId module consumers
/// </summary>
public static class FaceIdMassTransitExtensions
{
    public static void AddFaceIdMassTransitConsumers(this IBusRegistrationConfigurator configurator)
    {
        // Register consumer for face verification requests from Attendance Service (NEW HR system)
        configurator.AddConsumer<FaceVerificationRequestConsumer>();
    }

    public static void ConfigureFaceIdReceiveEndpoints(this IRabbitMqBusFactoryConfigurator cfg,
        IBusRegistrationContext context)
    {
        // Queue to receive face verification requests from Attendance Service
        cfg.ReceiveEndpoint("face_recognition_queue", e =>
        {
            e.ConfigureConsumer<FaceVerificationRequestConsumer>(context);
            e.UseMessageRetry(r => r.Interval(3, TimeSpan.FromSeconds(10)));
            e.PrefetchCount = 10; // Process up to 10 messages concurrently
        });
    }
}
