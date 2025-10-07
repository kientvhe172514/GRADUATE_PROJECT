using Microsoft.Extensions.Logging;
using Zentry.Modules.NotificationService.Services;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.NotificationService.Features.RegisterFcmToken;

/// <summary>
///     Handler để xử lý việc đăng ký FCM token
/// </summary>
public class RegisterFcmTokenCommandHandler : ICommandHandler<RegisterFcmTokenCommand, RegisterFcmTokenResponse>
{
    private readonly IDeviceManagementService _deviceManagementService;
    private readonly ILogger<RegisterFcmTokenCommandHandler> _logger;

    public RegisterFcmTokenCommandHandler(
        IDeviceManagementService deviceManagementService,
        ILogger<RegisterFcmTokenCommandHandler> logger)
    {
        _deviceManagementService = deviceManagementService;
        _logger = logger;
    }

    public async Task<RegisterFcmTokenResponse> Handle(RegisterFcmTokenCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Registering FCM token for user {UserId} with Android ID {AndroidId}",
                request.UserId, request.AndroidId);

            // 1. Tìm device existing theo AndroidId
            var existingDeviceResponse = await _deviceManagementService.GetDeviceByAndroidIdAsync(request.AndroidId);

            if (existingDeviceResponse.Device != null)
            {
                // 2. Update FCM token cho device existing
                _logger.LogInformation("Found existing device {DeviceId}, updating FCM token",
                    existingDeviceResponse.Device.Id);

                var updateResult = await _deviceManagementService.UpdateDeviceFcmTokenAsync(
                    existingDeviceResponse.Device.Id,
                    request.FcmToken,
                    request.Platform,
                    request.Model,
                    request.Manufacturer,
                    request.OsVersion,
                    request.AppVersion);

                return new RegisterFcmTokenResponse
                {
                    DeviceId = existingDeviceResponse.Device.Id,
                    UserId = request.UserId,
                    AndroidId = request.AndroidId,
                    FcmToken = request.FcmToken,
                    Platform = request.Platform,
                    Status = "Updated",
                    RegisteredAt = DateTime.UtcNow,
                    Message = "FCM token updated successfully for existing device"
                };
            }

            // 3. Tạo device mới với FCM token
            _logger.LogInformation("No existing device found, creating new device for user {UserId}",
                request.UserId);

            var createResult = await _deviceManagementService.CreateDeviceWithFcmTokenAsync(
                request.UserId,
                request.AndroidId,
                request.FcmToken,
                request.Platform,
                request.DeviceName ?? $"Device_{request.Platform}",
                request.Model,
                request.Manufacturer,
                request.OsVersion,
                request.AppVersion);

            return new RegisterFcmTokenResponse
            {
                DeviceId = createResult.DeviceId,
                UserId = request.UserId,
                AndroidId = request.AndroidId,
                FcmToken = request.FcmToken,
                Platform = request.Platform,
                Status = "Created",
                RegisteredAt = DateTime.UtcNow,
                Message = "New device created and FCM token registered successfully"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registering FCM token for user {UserId} with Android ID {AndroidId}",
                request.UserId, request.AndroidId);
            throw new ApplicationException($"Failed to register FCM token: {ex.Message}", ex);
        }
    }
}