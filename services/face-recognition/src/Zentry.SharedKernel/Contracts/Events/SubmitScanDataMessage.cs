namespace Zentry.SharedKernel.Contracts.Events;

public record SubmitScanDataMessage(
    string SubmitterDeviceAndroidId,
    Guid SessionId,
    Guid RoundId,
    List<ScannedDeviceContractForMessage> ScannedDevices,
    DateTime Timestamp,
    bool IsLateSubmission = false // Added with default value for backward compatibility
);

public record ScannedDeviceContractForMessage(
    string AndroidId,
    int Rssi
);