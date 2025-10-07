namespace Zentry.Modules.AttendanceManagement.Application.Dtos;

public class DeviceRecordDto
{
    public required string DeviceId { get; set; }
    public required string Role { get; set; }
    public required List<string> ScanList { get; set; }
}