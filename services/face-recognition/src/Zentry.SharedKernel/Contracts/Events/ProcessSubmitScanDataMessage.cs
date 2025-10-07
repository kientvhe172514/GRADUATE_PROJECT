using Zentry.SharedKernel.Contracts.Attendance;

namespace Zentry.SharedKernel.Contracts.Events;

public record ProcessSubmitScanDataMessage
{
    public string SubmitterDeviceAndroidId { get; init; } = string.Empty;
    public Guid SessionId { get; init; }
    public List<ScannedDeviceContract> ScannedDevices { get; init; } = new();
    public DateTime Timestamp { get; init; }
}