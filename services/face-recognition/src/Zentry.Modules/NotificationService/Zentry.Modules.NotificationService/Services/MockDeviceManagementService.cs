using Microsoft.Extensions.Logging;
using Zentry.SharedKernel.Contracts.Device;

namespace Zentry.Modules.NotificationService.Services;

/// <summary>
///     Mock service để test FCM token registration
///     TODO: Thay thế bằng DeviceManagement integration thực tế
/// </summary>
public class MockDeviceManagementService : IDeviceManagementService
{
    private readonly Dictionary<string, MockDeviceInfo> _devices = new();
    private readonly ILogger<MockDeviceManagementService> _logger;

    public MockDeviceManagementService(ILogger<MockDeviceManagementService> logger)
    {
        _logger = logger;
    }

    public async Task<GetDeviceByAndroidIdIntegrationResponse> GetDeviceByAndroidIdAsync(string androidId)
    {
        _logger.LogInformation("Mock: Getting device by Android ID {AndroidId}", androidId);

        if (_devices.TryGetValue(androidId, out var device))
            return new GetDeviceByAndroidIdIntegrationResponse
            {
                Device = new DeviceInfo
                {
                    Id = device.Id,
                    UserId = device.UserId,
                    Status = device.Status,
                    CreatedAt = device.CreatedAt,
                    LastVerifiedAt = device.LastVerifiedAt
                }
            };

        return new GetDeviceByAndroidIdIntegrationResponse { Device = null };
    }

    public async Task<UpdateDeviceFcmTokenIntegrationResponse> UpdateDeviceFcmTokenAsync(
        Guid deviceId,
        string fcmToken,
        string platform,
        string? model = null,
        string? manufacturer = null,
        string? osVersion = null,
        string? appVersion = null)
    {
        _logger.LogInformation("Mock: Updating FCM token for device {DeviceId}", deviceId);

        // Tìm device theo ID
        var device = _devices.Values.FirstOrDefault(d => d.Id == deviceId);
        if (device != null)
        {
            device.FcmToken = fcmToken;
            device.Platform = platform;
            device.Model = model ?? device.Model;
            device.Manufacturer = manufacturer ?? device.Manufacturer;
            device.OsVersion = osVersion ?? device.OsVersion;
            device.AppVersion = appVersion ?? device.AppVersion;
            device.UpdatedAt = DateTime.UtcNow;

            return new UpdateDeviceFcmTokenIntegrationResponse
            {
                DeviceId = deviceId,
                FcmToken = fcmToken,
                UpdatedAt = device.UpdatedAt,
                Message = "FCM token updated successfully"
            };
        }

        throw new InvalidOperationException($"Device with ID {deviceId} not found");
    }

    public async Task<CreateDeviceWithFcmTokenIntegrationResponse> CreateDeviceWithFcmTokenAsync(
        Guid userId,
        string androidId,
        string fcmToken,
        string platform,
        string deviceName,
        string? model = null,
        string? manufacturer = null,
        string? osVersion = null,
        string? appVersion = null)
    {
        _logger.LogInformation("Mock: Creating new device for user {UserId} with Android ID {AndroidId}", userId,
            androidId);

        var newDevice = new MockDeviceInfo
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            AndroidId = androidId,
            FcmToken = fcmToken,
            Platform = platform,
            DeviceName = deviceName,
            Model = model,
            Manufacturer = manufacturer,
            OsVersion = osVersion,
            AppVersion = appVersion,
            Status = "Active",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _devices[androidId] = newDevice;

        return new CreateDeviceWithFcmTokenIntegrationResponse
        {
            DeviceId = newDevice.Id,
            UserId = userId,
            AndroidId = androidId,
            FcmToken = fcmToken,
            Platform = platform,
            CreatedAt = newDevice.CreatedAt,
            Message = "Device created successfully with FCM token"
        };
    }

    public async Task<List<string>> GetFcmTokensByUserIdAsync(Guid userId)
    {
        _logger.LogInformation("Mock: Getting FCM tokens for user {UserId}", userId);

        return _devices.Values
            .Where(d => d.UserId == userId && !string.IsNullOrEmpty(d.FcmToken))
            .Select(d => d.FcmToken!)
            .ToList();
    }

    private class MockDeviceInfo
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string AndroidId { get; set; } = string.Empty;
        public string FcmToken { get; set; } = string.Empty;
        public string Platform { get; set; } = string.Empty;
        public string DeviceName { get; set; } = string.Empty;
        public string? Model { get; set; }
        public string? Manufacturer { get; set; }
        public string? OsVersion { get; set; }
        public string? AppVersion { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? LastVerifiedAt { get; set; }
    }
}

/// <summary>
///     Interface cho DeviceManagement service
/// </summary>
public interface IDeviceManagementService
{
    Task<GetDeviceByAndroidIdIntegrationResponse> GetDeviceByAndroidIdAsync(string androidId);

    Task<UpdateDeviceFcmTokenIntegrationResponse> UpdateDeviceFcmTokenAsync(
        Guid deviceId,
        string fcmToken,
        string platform,
        string? model = null,
        string? manufacturer = null,
        string? osVersion = null,
        string? appVersion = null);

    Task<CreateDeviceWithFcmTokenIntegrationResponse> CreateDeviceWithFcmTokenAsync(
        Guid userId,
        string androidId,
        string fcmToken,
        string platform,
        string deviceName,
        string? model = null,
        string? manufacturer = null,
        string? osVersion = null,
        string? appVersion = null);

    Task<List<string>> GetFcmTokensByUserIdAsync(Guid userId);
}