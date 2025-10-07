namespace Zentry.Modules.DeviceManagement.Features.RegisterDevice;

public class RegisterDeviceRequest
{
    public string UserId { get; set; } = string.Empty;
    public string DeviceName { get; set; } = string.Empty;
    public string AndroidId { get; set; } = string.Empty;
    public string? Platform { get; set; } // Nền tảng (ví dụ: "iOS", "Android")
    public string? OsVersion { get; set; } // Phiên bản hệ điều hành (ví dụ: "17.5.1", "14")
    public string? Model { get; set; } // Tên model thiết bị (ví dụ: "iPhone 15 Pro", "Samsung Galaxy S24")
    public string? Manufacturer { get; set; } // Nhà sản xuất thiết bị (ví dụ: "Apple", "Samsung")
    public string? AppVersion { get; set; } // Phiên bản ứng dụng đang chạy (ví dụ: "1.0.0", "1.2.3")
    public string? PushNotificationToken { get; set; } // Token Push Notification từ dịch vụ (FCM/APNS)
}