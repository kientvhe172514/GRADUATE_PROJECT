namespace Zentry.Modules.AttendanceManagement.Domain.ValueObjects;

public record ScannedDevice(
    string DeviceId,
    int Rssi
);