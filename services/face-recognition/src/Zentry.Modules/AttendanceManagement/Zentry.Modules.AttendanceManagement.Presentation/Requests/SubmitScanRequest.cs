using System.ComponentModel.DataAnnotations;
using Zentry.Modules.AttendanceManagement.Domain.ValueObjects;

namespace Zentry.Modules.AttendanceManagement.Presentation.Requests;

public record SubmitScanRequest(
    [Required] string SubmitterDeviceAndroidId, // Đổi từ DeviceId thành AndroidId của thiết bị gửi request
    // [Required] Guid SubmitterUserId, // UserId sẽ được lấy từ AndroidId
    [Required] Guid SessionId,
    [Required] List<ScannedDeviceFromRequest> ScannedDevices, // Thay đổi loại ScannedDevice
    [Required] DateTime Timestamp
);