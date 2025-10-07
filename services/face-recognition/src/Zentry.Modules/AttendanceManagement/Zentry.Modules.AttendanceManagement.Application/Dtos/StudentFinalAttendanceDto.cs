namespace Zentry.Modules.AttendanceManagement.Application.Dtos;

public class StudentFinalAttendanceDto
{
    public Guid StudentId { get; set; }
    public string? StudentCode { get; set; }
    public string? FullName { get; set; }
    public Guid SessionId { get; set; }
    public required string SessionStatus { get; set; }
    public double FinalAttendancePercentage { get; set; }
    public int TotalRounds { get; set; }
    public int AttendedRoundsCount { get; set; }
    public int MissedRoundsCount { get; set; }
    public string FinalStatus { get; set; }
    public List<RoundAttendanceDetailDto> RoundDetails { get; set; } = [];
}

public class RoundAttendanceDetailDto
{
    public Guid RoundId { get; set; }
    public int RoundNumber { get; set; }
    public bool IsAttended { get; set; }
    public DateTime? AttendedTime { get; set; }
}