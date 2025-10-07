namespace Zentry.Modules.AttendanceManagement.Application.Dtos;

public class FinalSessionDetailsDto
{
    public SessionInfoDto SessionInfo { get; set; } = null!;
    public List<FinalAttendanceDto> Students { get; set; } = [];
}