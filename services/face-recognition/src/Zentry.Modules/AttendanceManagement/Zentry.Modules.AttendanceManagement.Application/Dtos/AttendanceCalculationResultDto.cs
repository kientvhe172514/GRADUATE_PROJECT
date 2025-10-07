namespace Zentry.Modules.AttendanceManagement.Application.Dtos;

public class AttendanceCalculationResultDto
{
    public List<string> AttendedDeviceIds { get; set; } = [];
    public string? LecturerId { get; set; } = string.Empty;
}