namespace Zentry.Modules.AttendanceManagement.Application.Dtos;

public class RoundResultDto
{
    public Guid RoundId { get; set; }
    public int RoundNumber { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Status { get; set; } = string.Empty;

    public List<StudentAttendanceDto> StudentsAttendance { get; set; } = [];
}