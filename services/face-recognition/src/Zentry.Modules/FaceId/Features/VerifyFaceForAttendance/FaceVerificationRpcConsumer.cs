using MassTransit;
using MassTransit.RabbitMqTransport;
using MediatR;
using Microsoft.Extensions.Logging;
using System.Text.Json.Serialization;
using RabbitMQ.Client;

namespace Zentry.Modules.FaceId.Features.VerifyFaceForAttendance;

/// <summary>
/// Envelope for NestJS RPC messages (matching NestJS pattern)
/// </summary>
public record NestJsRpcEnvelope(
    [property: JsonPropertyName("pattern")] string Pattern,
    [property: JsonPropertyName("data")] FaceVerificationRpcRequest Data,
    [property: JsonPropertyName("id")] string Id
);

/// <summary>
/// RPC Request for face verification (from NestJS attendance service)
/// </summary>
public record FaceVerificationRpcRequest(
    [property: JsonPropertyName("attendance_check_id")] int AttendanceCheckId,
    [property: JsonPropertyName("employee_id")] int EmployeeId,
    [property: JsonPropertyName("employee_code")] string EmployeeCode,
    [property: JsonPropertyName("check_type")] string CheckType,
    [property: JsonPropertyName("request_time")] DateTime RequestTime,
    [property: JsonPropertyName("face_embedding_base64")] string FaceEmbeddingBase64
);

/// <summary>
/// RPC Response for face verification (to NestJS attendance service)
/// </summary>
public record FaceVerificationRpcResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; init; }

    [JsonPropertyName("attendance_check_id")]
    public string AttendanceCheckId { get; init; } = string.Empty;

    [JsonPropertyName("employee_id")]
    public string EmployeeId { get; init; } = string.Empty;

    [JsonPropertyName("face_verified")]
    public bool FaceVerified { get; init; }

    [JsonPropertyName("face_confidence")]
    public double FaceConfidence { get; init; }

    [JsonPropertyName("verification_time")]
    public DateTime VerificationTime { get; init; }

    [JsonPropertyName("message")]
    public string? Message { get; init; }

    [JsonPropertyName("error_message")]
    public string? ErrorMessage { get; init; }
}

/// <summary>
/// RPC Consumer for SYNCHRONOUS face verification using Raw RabbitMQ Client
/// ✅ Bypasses MassTransit validation to support Direct Reply-To
/// </summary>
public class FaceVerificationRpcConsumer : IConsumer<NestJsRpcEnvelope>
{
    private readonly IMediator _mediator;
    private readonly ILogger<FaceVerificationRpcConsumer> _logger;
    private readonly IConnectionFactory _connectionFactory;

    public FaceVerificationRpcConsumer(
        IMediator mediator,
        ILogger<FaceVerificationRpcConsumer> logger,
        IConnectionFactory connectionFactory)
    {
        _mediator = mediator;
        _logger = logger;
        _connectionFactory = connectionFactory;
    }

    public async Task Consume(ConsumeContext<NestJsRpcEnvelope> context)
    {
        var envelope = context.Message;
        var request = envelope.Data;
        
        _logger.LogInformation(
            "📨 [RPC] Received face verification: AttendanceCheckId={AttendanceCheckId}, EmployeeId={EmployeeId}",
            request.AttendanceCheckId, request.EmployeeId);

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
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ [RPC] Failed to process face verification");
            
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

        // Extract ReplyTo and CorrelationId from RabbitMQ BasicProperties
        string? replyToQueue = null;
        string? correlationId = envelope.Id;
        
        if (context.TryGetPayload(out RabbitMqBasicConsumeContext? rabbitContext))
        {
            replyToQueue = rabbitContext.Properties.ReplyTo;
            correlationId = rabbitContext.Properties.CorrelationId ?? envelope.Id;
        }

        // ✅ BYPASS MassTransit: Use raw RabbitMQ IChannel to publish directly
        if (!string.IsNullOrEmpty(replyToQueue) && !string.IsNullOrEmpty(correlationId))
        {
            try
            {
                await using var connection = await _connectionFactory.CreateConnectionAsync();
                await using var channel = await connection.CreateChannelAsync();

                // Serialize to JSON
                var jsonOptions = new System.Text.Json.JsonSerializerOptions
                {
                    PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase,
                    DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
                };
                var responseJson = System.Text.Json.JsonSerializer.Serialize(response, jsonOptions);
                var responseBody = System.Text.Encoding.UTF8.GetBytes(responseJson);

                var properties = new BasicProperties
                {
                    CorrelationId = correlationId,
                    ContentType = "application/json",
                    DeliveryMode = DeliveryModes.Transient
                };

                _logger.LogInformation(
                    "📤 [RPC] Publishing to Default Exchange: RoutingKey={ReplyQueue}, CorrelationId={CorrelationId}",
                    replyToQueue, correlationId);

                // ✅ Publish to DEFAULT EXCHANGE ("") with replyToQueue as routing key
                await channel.BasicPublishAsync(
                    exchange: string.Empty,
                    routingKey: replyToQueue,
                    mandatory: false,
                    basicProperties: properties,
                    body: responseBody,
                    cancellationToken: context.CancellationToken);

                _logger.LogInformation("✅ [RPC] Response sent successfully via raw RabbitMQ");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [RPC] Failed to publish response via raw RabbitMQ");
                throw;
            }
        }
        else
        {
            _logger.LogError("❌ [RPC] ReplyTo or CorrelationId missing");
            throw new InvalidOperationException("ReplyTo or CorrelationId not found");
        }
    }
}
