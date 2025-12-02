using MassTransit;
using MassTransit.RabbitMqTransport;
using MediatR;
using Microsoft.Extensions.Logging;
using System.Text.Json.Serialization;
using RabbitMQ.Client;

namespace Zentry.Modules.FaceId.Features.VerifyFaceForAttendance;

/// <summary>
/// NestJS RPC Message Envelope - ClientProxy.send() wraps data in this structure
/// Pattern: { "pattern": "...", "data": {...}, "id": "..." }
/// </summary>
public record NestJsRpcEnvelope
{
    [JsonPropertyName("pattern")]
    public string Pattern { get; init; } = string.Empty;
    
    [JsonPropertyName("data")]
    public FaceVerificationRpcRequest Data { get; init; } = new();
    
    [JsonPropertyName("id")]
    public string Id { get; init; } = string.Empty;
}

/// <summary>
/// RPC Request for face verification - ACTUAL data nested in NestJsRpcEnvelope.data
/// This is for NEW HR employee attendance system (NOT old school system)
/// ✅ Uses JsonPropertyName for explicit mapping from NestJS snake_case
/// </summary>
public record FaceVerificationRpcRequest
{
    [JsonPropertyName("employee_id")]
    public int EmployeeId { get; init; }
    
    [JsonPropertyName("employee_code")]
    public string EmployeeCode { get; init; } = string.Empty;
    
    [JsonPropertyName("attendance_check_id")]
    public int AttendanceCheckId { get; init; }
    
    [JsonPropertyName("shift_id")]
    public int ShiftId { get; init; }
    
    [JsonPropertyName("check_type")]
    public string CheckType { get; init; } = string.Empty; // "check_in" or "check_out"
    
    [JsonPropertyName("request_time")]
    public DateTime RequestTime { get; init; }
    
    [JsonPropertyName("face_embedding_base64")]
    public string? FaceEmbeddingBase64 { get; init; }
}

/// <summary>
/// Response returned synchronously to Attendance Service
/// ✅ Uses JsonPropertyName for explicit mapping to NestJS snake_case
/// </summary>
public record FaceVerificationRpcResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; init; }
    
    [JsonPropertyName("attendance_check_id")]
    public int AttendanceCheckId { get; init; }
    
    [JsonPropertyName("employee_id")]
    public int EmployeeId { get; init; }
    
    [JsonPropertyName("face_verified")]
    public bool FaceVerified { get; init; }
    
    [JsonPropertyName("face_confidence")]
    public double FaceConfidence { get; init; }
    
    [JsonPropertyName("verification_time")]
    public DateTime VerificationTime { get; init; }
    
    [JsonPropertyName("error_message")]
    public string? ErrorMessage { get; init; }
    
    [JsonPropertyName("message")]
    public string? Message { get; init; }
}

/// <summary>
/// RPC Consumer for SYNCHRONOUS face verification requests from Attendance Service
/// ✅ Consumes NestJsRpcEnvelope wrapper to match ClientProxy.send() structure
/// </summary>
public class FaceVerificationRpcConsumer : IConsumer<NestJsRpcEnvelope>
{
    private readonly IMediator _mediator;
    private readonly ILogger<FaceVerificationRpcConsumer> _logger;
    private readonly IBus _bus; // 🆕 Inject IBus for sending responses

    public FaceVerificationRpcConsumer(
        IMediator mediator,
        ILogger<FaceVerificationRpcConsumer> logger,
        IBus bus) // 🆕 Inject IBus
    {
        _mediator = mediator;
        _logger = logger;
        _bus = bus; // 🆕 Store IBus instance
    }

    public async Task Consume(ConsumeContext<NestJsRpcEnvelope> context)
    {
        var envelope = context.Message;
        var request = envelope.Data; // Extract actual data from NestJS envelope
        
        // 🔍 DEBUG: Log raw message body to see what MassTransit actually received
        var rawBody = context.ReceiveContext.GetBody();
        var rawJson = System.Text.Encoding.UTF8.GetString(rawBody);
        _logger.LogInformation("🔍 [DEBUG] Raw message body: {RawJson}", rawJson);
        _logger.LogInformation("🔍 [DEBUG] Envelope Pattern: {Pattern}, ID: {Id}", envelope.Pattern, envelope.Id);
        
        _logger.LogInformation(
            "📨 [RPC] Received SYNC face verification request: AttendanceCheckId={AttendanceCheckId}, " +
            "EmployeeId={EmployeeId}, EmployeeCode={EmployeeCode}, CheckType={CheckType}",
            request.AttendanceCheckId, request.EmployeeId, request.EmployeeCode, request.CheckType);

        FaceVerificationRpcResponse response;
        
        try
        {
            var command = new VerifyFaceForAttendanceCommand
            {
                AttendanceCheckId = request.AttendanceCheckId,
                EmployeeId = request.EmployeeId,
                EmployeeCode = request.EmployeeCode,
                CheckType = request.CheckType,
                RequestTime = request.RequestTime,
                FaceEmbeddingBase64 = request.FaceEmbeddingBase64
            };

            var result = await _mediator.Send(command);
            
            response = new FaceVerificationRpcResponse
            {
                Success = result.Success,
                AttendanceCheckId = request.AttendanceCheckId,
                EmployeeId = request.EmployeeId,
                FaceVerified = result.FaceVerified,
                FaceConfidence = result.FaceConfidence,
                VerificationTime = DateTime.UtcNow,
                ErrorMessage = result.Success ? null : result.Message,
                Message = result.Message
            };
            
            _logger.LogInformation(
                "✅ [RPC] Face verification completed: AttendanceCheckId={AttendanceCheckId}, " +
                "FaceVerified={FaceVerified}, Confidence={Confidence:P1}",
                request.AttendanceCheckId, result.FaceVerified, result.FaceConfidence);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "❌ [RPC] Failed to process face verification: EmployeeId={EmployeeId}, AttendanceCheckId={AttendanceCheckId}",
                request.EmployeeId, request.AttendanceCheckId);
            
            response = new FaceVerificationRpcResponse
            {
                Success = false,
                AttendanceCheckId = request.AttendanceCheckId,
                EmployeeId = request.EmployeeId,
                FaceVerified = false,
                FaceConfidence = 0,
                VerificationTime = DateTime.UtcNow,
                ErrorMessage = $"Face verification error: {ex.Message}",
                Message = "Internal error during face verification"
            };
        }

        // 🔍 DEBUG: Log ALL headers to see what NestJS actually sends
        _logger.LogInformation("🔍 [DEBUG] === ALL HEADERS START ===");
        foreach (var header in context.Headers.GetAll())
        {
            _logger.LogInformation("🔍 [HEADER] Key={Key}, Value={Value}", header.Key, header.Value);
        }
        _logger.LogInformation("🔍 [DEBUG] === ALL HEADERS END ===");
        
        // 🔍 DEBUG: Check MassTransit context properties
        _logger.LogInformation(
            "🔍 [DEBUG] MassTransit Context: ResponseAddress={ResponseAddress}, " +
            "SourceAddress={SourceAddress}, DestinationAddress={DestinationAddress}, " +
            "RequestId={RequestId}, CorrelationId={CorrelationId}, ConversationId={ConversationId}",
            context.ResponseAddress, context.SourceAddress, context.DestinationAddress,
            context.RequestId, context.CorrelationId, context.ConversationId);
        
        // ✅ CRITICAL FIX: Extract ReplyTo from RabbitMQ BasicProperties (not headers!)
        // NestJS ClientProxy sets ReplyTo in AMQP BasicProperties.ReplyTo, not custom headers
        string? replyToQueue = null;
        string? correlationId = envelope.Id; // Use NestJS envelope ID as correlation
        
        // Try to get ReplyTo from RabbitMQ transport context
        if (context.TryGetPayload(out RabbitMqBasicConsumeContext? rabbitContext))
        {
            replyToQueue = rabbitContext.Properties.ReplyTo;
            correlationId = rabbitContext.Properties.CorrelationId ?? envelope.Id;
            
            _logger.LogInformation(
                "🔍 [DEBUG] RabbitMQ BasicProperties: ReplyTo={ReplyTo}, CorrelationId={CorrelationId}, " +
                "MessageId={MessageId}, DeliveryMode={DeliveryMode}, Type={Type}, ContentType={ContentType}",
                replyToQueue, correlationId, rabbitContext.Properties.MessageId, 
                rabbitContext.Properties.DeliveryMode, rabbitContext.Properties.Type, 
                rabbitContext.Properties.ContentType);
        }
        else
        {
            _logger.LogWarning("⚠️ [RPC] Could not access RabbitMQ transport context!");
        }
        
        // 🔍 Try MassTransit's ResponseAddress as fallback
        if (string.IsNullOrEmpty(replyToQueue) && context.ResponseAddress != null)
        {
            replyToQueue = context.ResponseAddress.AbsolutePath.TrimStart('/');
            _logger.LogInformation("🔍 [DEBUG] Using ResponseAddress: {ReplyTo}", replyToQueue);
        }
        
        _logger.LogInformation(
            "🔍 [DEBUG] Response payload: FaceVerified={FaceVerified}, Confidence={Confidence:P1}, " +
            "AttendanceCheckId={AttendanceCheckId}, Success={Success}",
            response.FaceVerified, response.FaceConfidence, response.AttendanceCheckId, response.Success);

        // ✅ SOLUTION: Use IBus to send response via Default Exchange with manual RoutingKey
        if (!string.IsNullOrEmpty(replyToQueue) && !string.IsNullOrEmpty(correlationId))
        {
            try
            {
                // 1. Get Host Address from IBus to construct URI for Default Exchange
                Uri hostAddress = _bus.Address;
                
                // 2. Create URI pointing to Default Exchange (empty string "")
                // Use the replyToQueue directly as the destination
                var replyUri = new Uri($"{hostAddress.Scheme}://{hostAddress.Host}:{hostAddress.Port}/{replyToQueue}");

                _logger.LogInformation(
                    "🔍 [DEBUG] Sending to Reply URI: {Uri}", 
                    replyUri);

                // 3. Get SendEndpoint for Reply Queue
                var sendEndpoint = await _bus.GetSendEndpoint(replyUri);
                
                // 4. Send Response with CorrelationId
                await sendEndpoint.Send(response, ctx =>
                {
                    // Set Correlation ID (convert string to Guid if possible)
                    ctx.CorrelationId = Guid.TryParse(correlationId, out var guid) 
                        ? guid 
                        : Guid.NewGuid();
                    
                    _logger.LogInformation(
                        "📤 [RPC] Sending response with CorrelationId={CorrelationId}",
                        ctx.CorrelationId);
                });
                
                _logger.LogInformation(
                    "✅ [RPC] Response sent successfully via IBus to {ReplyQueue} for AttendanceCheckId={AttendanceCheckId}",
                    replyToQueue, request.AttendanceCheckId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, 
                    "❌ [RPC] Failed to send response via IBus: ReplyTo={ReplyTo}", replyToQueue);
                throw;
            }
        }
        else
        {
            _logger.LogError(
                "❌ [RPC] Cannot send response: ReplyTo={ReplyTo}, CorrelationId={CorrelationId}",
                replyToQueue ?? "NULL", correlationId ?? "NULL");
            throw new InvalidOperationException("ReplyTo address not found in RabbitMQ message properties");
        }
    }
}
