using System.ComponentModel.DataAnnotations;
using Zentry.Modules.DeviceManagement.ValueObjects;
using Zentry.SharedKernel.Common;
using Zentry.SharedKernel.Constants.Device;
using Zentry.SharedKernel.Domain;

namespace Zentry.Modules.DeviceManagement.Entities;

public class Device : AggregateRoot<Guid>
{
    private Device() : base(Guid.Empty)
    {
    }

    private Device(
        Guid id,
        Guid userId,
        DeviceName deviceName,
        DeviceToken deviceToken,
        AndroidId androidId,
        string? platform,
        string? osVersion,
        string? model,
        string? manufacturer,
        string? appVersion,
        string? pushNotificationToken
    ) : base(id)
    {
        Guard.AgainstNull(deviceName, nameof(deviceName));
        Guard.AgainstNull(deviceToken, nameof(deviceToken));
        Guard.AgainstNull(androidId, nameof(androidId));

        UserId = userId;
        DeviceName = deviceName;
        DeviceToken = deviceToken;
        AndroidId = androidId;
        Platform = platform;
        OsVersion = osVersion;
        Model = model;
        Manufacturer = manufacturer;
        AppVersion = appVersion;
        PushNotificationToken = pushNotificationToken;

        CreatedAt = DateTime.UtcNow;
        Status = DeviceStatus.Active;
    }

    [Required] public Guid UserId { get; private set; }

    public DeviceName DeviceName { get; private set; }
    public DeviceToken DeviceToken { get; }
    public AndroidId AndroidId { get; private set; }

    [StringLength(50)] // Giới hạn độ dài của Platform
    public string? Platform { get; private set; }

    [StringLength(50)] // Giới hạn độ dài của OsVersion
    public string? OsVersion { get; private set; }

    [StringLength(50)] // Giới hạn độ dài của Model
    public string? Model { get; private set; }

    [StringLength(50)] // Giới hạn độ dài của Manufacturer
    public string? Manufacturer { get; private set; }

    [StringLength(50)] // Giới hạn độ dài của AppVersion
    public string? AppVersion { get; private set; }

    [StringLength(255)] // Giới hạn độ dài của PushNotificationToken
    public string? PushNotificationToken { get; private set; }

    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? LastVerifiedAt { get; private set; } = DateTime.UtcNow;
    public DeviceStatus Status { get; private set; }

    public static Device Create(
        Guid userId,
        DeviceName deviceName,
        DeviceToken deviceToken,
        AndroidId androidId,
        string? platform = null,
        string? osVersion = null,
        string? model = null,
        string? manufacturer = null,
        string? appVersion = null,
        string? pushNotificationToken = null
    )
    {
        var device = new Device(
            Guid.NewGuid(),
            userId,
            deviceName,
            deviceToken,
            androidId,
            platform,
            osVersion,
            model,
            manufacturer,
            appVersion,
            pushNotificationToken
        );
        return device;
    }

    public void Update(
        DeviceName deviceName,
        DeviceStatus status,
        AndroidId? androidId = null,
        string? platform = null,
        string? osVersion = null,
        string? model = null,
        string? manufacturer = null,
        string? appVersion = null,
        string? pushNotificationToken = null
    )
    {
        Guard.AgainstNull(deviceName, nameof(deviceName));
        DeviceName = deviceName;
        Status = status;

        if (androidId != null) AndroidId = androidId;
        if (platform != null) Platform = platform;
        if (osVersion != null) OsVersion = osVersion;
        if (model != null) Model = model;
        if (manufacturer != null) Manufacturer = manufacturer;
        if (appVersion != null) AppVersion = appVersion;
        if (pushNotificationToken != null) PushNotificationToken = pushNotificationToken;

        UpdatedAt = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        Status = DeviceStatus.Inactive;
        UpdatedAt = DateTime.UtcNow;
    }

    public bool VerifyToken(string token)
    {
        Guard.AgainstNullOrEmpty(token, nameof(token));
        if (DeviceToken.Value != token) return false;

        LastVerifiedAt = DateTime.UtcNow;
        return true;
    }

    public bool VerifyAndroidId(string androidId)
    {
        Guard.AgainstNullOrEmpty(androidId, nameof(androidId));
        return AndroidId.Value.Equals(androidId, StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsSameAndroidId(Device device, string androidId)
    {
        return device.AndroidId.Value.Equals(androidId, StringComparison.OrdinalIgnoreCase);
    }

    public void UpdateStatus(DeviceStatus newStatus)
    {
        if (Equals(Status, newStatus)) return;

        Status = newStatus;
        UpdatedAt = DateTime.UtcNow;
    }
}