// File: Zentry.Modules.AttendanceManagement.Domain.Entities/ScanLog.cs

using Zentry.Modules.AttendanceManagement.Domain.ValueObjects;

namespace Zentry.Modules.AttendanceManagement.Domain.Entities;

public class ScanLog
{
    public ScanLog()
    {
    }

    private ScanLog(
        Guid id,
        Guid deviceId,
        Guid submitterUserId,
        Guid sessionId,
        Guid roundId,
        DateTime timestamp,
        List<ScannedDevice> scannedDevices
    )
    {
        Id = id;
        DeviceId = deviceId;
        SubmitterUserId = submitterUserId;
        SessionId = sessionId;
        RoundId = roundId;
        Timestamp = timestamp;
        ScannedDevices = scannedDevices;
    }

    public Guid Id { get; set; }
    public Guid DeviceId { get; set; }
    public Guid SubmitterUserId { get; set; }
    public Guid SessionId { get; set; }
    public Guid RoundId { get; set; }
    public DateTime Timestamp { get; set; }
    public List<ScannedDevice> ScannedDevices { get; set; }

    public static ScanLog Create(
        Guid id,
        Guid deviceId,
        Guid submitterUserId,
        Guid sessionId,
        Guid roundId,
        DateTime timestamp,
        List<ScannedDevice> scannedDevices)
    {
        return new ScanLog(id, deviceId, submitterUserId, sessionId, roundId, timestamp, scannedDevices);
    }
}