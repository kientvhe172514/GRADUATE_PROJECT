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
        // Queue to receive face verification requests from Attendance Service (NestJS)
        // 🔧 FIX: Direct queue binding (no exchange) - NestJS sends to queue directly
        cfg.ReceiveEndpoint("face_recognition_queue", e =>
        {
            // 🔧 REMOVED exchange binding - NestJS ClientProxy.emit() sends directly to queue
            // with routing key = event name (Zentry.Contracts.Events.FaceVerificationRequestedEvent)
            
            // MassTransit will automatically create queue binding for message type
            // Pattern: urn:message:Zentry.Contracts.Events:FaceVerificationRequestedEvent
            
            e.ConfigureConsumer<FaceVerificationRequestConsumer>(context);
            e.UseMessageRetry(r => r.Interval(3, TimeSpan.FromSeconds(10)));
            e.PrefetchCount = 10; // Process up to 10 messages concurrently
        });
    }
}
