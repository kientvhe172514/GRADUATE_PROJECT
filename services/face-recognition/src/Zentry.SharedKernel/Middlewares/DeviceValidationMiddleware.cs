using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Device;

namespace Zentry.SharedKernel.Middlewares;

/// <summary>
///     Middleware để validate device token và session key
/// </summary>
public class DeviceValidationMiddleware
{
    private readonly RequestDelegate _next;

    public DeviceValidationMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            // ✅ Skip cho public endpoints
            if (IsPublicEndpoint(context.Request.Path))
            {
                await _next(context);
                return;
            }

            // ✅ Lấy services từ service provider
            var sessionService = context.RequestServices.GetRequiredService<ISessionService>();
            var mediator = context.RequestServices.GetRequiredService<IMediator>();
            var logger = context.RequestServices.GetRequiredService<ILogger<DeviceValidationMiddleware>>();

            // ✅ Lấy DeviceToken và SessionKey từ header
            var deviceToken = context.Request.Headers["X-Device-Token"].FirstOrDefault();
            var sessionKey = context.Request.Headers["X-Session-Key"].FirstOrDefault();

            if (string.IsNullOrEmpty(deviceToken) || string.IsNullOrEmpty(sessionKey))
            {
                logger.LogWarning("Missing device token or session key for endpoint {Endpoint}", context.Request.Path);
                context.Response.StatusCode = 401;
                await context.Response.WriteAsync("Device token and session key required");
                return;
            }

            // ✅ Validate device token
            var deviceResponse =
                await mediator.Send(new GetDeviceByTokenIntegrationQuery(deviceToken), context.RequestAborted);
            if (deviceResponse.Device == null)
            {
                logger.LogWarning("Invalid device token {DeviceToken} for endpoint {Endpoint}", deviceToken,
                    context.Request.Path);
                context.Response.StatusCode = 401;
                await context.Response.WriteAsync("Invalid device token");
                return;
            }

            // ✅ Kiểm tra device status
            if (deviceResponse.Device.Status != "Active")
            {
                logger.LogWarning("Device {DeviceId} is not active (Status: {Status}) for endpoint {Endpoint}",
                    deviceResponse.Device.Id, deviceResponse.Device.Status, context.Request.Path);
                context.Response.StatusCode = 401;
                await context.Response.WriteAsync("Device not active");
                return;
            }

            // ✅ Validate session
            if (!await sessionService.ValidateSessionAsync(sessionKey, deviceResponse.Device.Id))
            {
                logger.LogWarning("Invalid or expired session {SessionKey} for device {DeviceId} endpoint {Endpoint}",
                    sessionKey, deviceResponse.Device.Id, context.Request.Path);
                context.Response.StatusCode = 401;
                await context.Response.WriteAsync("Invalid or expired session");
                return;
            }

            // ✅ Lưu user info vào context để controllers sử dụng
            var userId = await sessionService.GetUserIdFromSessionAsync(sessionKey);
            context.Items["UserId"] = userId;
            context.Items["DeviceId"] = deviceResponse.Device.Id;

            logger.LogDebug("Device validation successful for user {UserId} device {DeviceId} endpoint {Endpoint}",
                userId, deviceResponse.Device.Id, context.Request.Path);

            await _next(context);
        }
        catch (Exception ex)
        {
            var logger = context.RequestServices.GetRequiredService<ILogger<DeviceValidationMiddleware>>();
            logger.LogError(ex, "Error in device validation middleware for endpoint {Endpoint}", context.Request.Path);
            context.Response.StatusCode = 500;
            await context.Response.WriteAsync("Internal server error during device validation");
        }
    }

    private static bool IsPublicEndpoint(PathString path)
    {
        var publicPaths = new[]
        {
            "/api/auth/sign-in",
            "/api/devices/register",
            "/health",
            "/api/auth/reset-password/request",
            "/api/auth/reset-password/confirm"
        };
        return publicPaths.Any(p => path.StartsWithSegments(p));
    }
}

// Extension method để đăng ký middleware
public static class DeviceValidationMiddlewareExtensions
{
    public static IApplicationBuilder UseDeviceValidationMiddleware(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<DeviceValidationMiddleware>();
    }
}