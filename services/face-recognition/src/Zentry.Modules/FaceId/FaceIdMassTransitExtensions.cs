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
        configurator.AddConsumer<FaceVerificationRequestConsumer>(); // ASYNC event-based (deprecated)
        configurator.AddConsumer<FaceVerificationRpcConsumer>(); // ✅ NEW: SYNC RPC-based
    }

    public static void ConfigureFaceIdReceiveEndpoints(this IRabbitMqBusFactoryConfigurator cfg,
        IBusRegistrationContext context)
    {
        // ===== ASYNC Event Queue (DEPRECATED - kept for backward compatibility) =====
        // Queue to receive face verification requests from Attendance Service (NestJS)
        // 🔧 Accept PLAIN JSON from NestJS without MassTransit envelope
        cfg.ReceiveEndpoint("face_recognition_queue", e =>
        {
            // ✅ CRITICAL: Use Raw JSON Deserializer with AnyMessageType
            // This allows MassTransit to accept plain JSON objects from NestJS ClientProxy.emit()
            // WITHOUT requiring MassTransit envelope wrapper
            e.UseRawJsonDeserializer(RawSerializerOptions.AnyMessageType);
            
            // 🆕 Clear default deserializers to force raw JSON only
            e.ClearSerialization();
            e.UseRawJsonSerializer(RawSerializerOptions.AnyMessageType);
            e.UseRawJsonDeserializer(RawSerializerOptions.AnyMessageType);
            
            e.ConfigureConsumer<FaceVerificationRequestConsumer>(context);
            e.UseMessageRetry(r => r.Interval(3, TimeSpan.FromSeconds(10)));
            e.PrefetchCount = 10; // Process up to 10 messages concurrently
        });
        
        // ===== ✅ NEW: SYNC RPC Queue for immediate response =====
        cfg.ReceiveEndpoint("face_verification_rpc_queue", e =>
        {
            // Use Raw JSON for NestJS compatibility
            e.UseRawJsonDeserializer(RawSerializerOptions.AnyMessageType);
            e.ClearSerialization();
            e.UseRawJsonSerializer(RawSerializerOptions.AnyMessageType);
            e.UseRawJsonDeserializer(RawSerializerOptions.AnyMessageType);
            
            e.ConfigureConsumer<FaceVerificationRpcConsumer>(context);
            e.UseMessageRetry(r => r.Interval(2, TimeSpan.FromSeconds(5))); // Shorter retry for RPC
            e.PrefetchCount = 20; // Higher concurrency for RPC requests
        });
    }
}
