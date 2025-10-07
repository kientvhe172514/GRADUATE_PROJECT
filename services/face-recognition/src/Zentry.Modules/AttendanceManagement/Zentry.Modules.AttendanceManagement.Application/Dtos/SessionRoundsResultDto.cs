namespace Zentry.Modules.AttendanceManagement.Application.Dtos;

public class SessionRoundsResultDto
{
    public Guid SessionId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public int TotalAttendanceRounds { get; set; }

    public List<RoundResultDto> Rounds { get; set; } = [];
}