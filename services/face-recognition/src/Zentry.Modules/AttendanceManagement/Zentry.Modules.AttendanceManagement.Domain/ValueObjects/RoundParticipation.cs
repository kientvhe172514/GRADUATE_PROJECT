namespace Zentry.Modules.AttendanceManagement.Domain.ValueObjects;

public class RoundParticipation
{
    public Guid RoundId { get; set; }
    public Guid SessionId { get; set; }
    public int RoundNumber { get; set; }
    public bool IsAttended { get; set; }
    public DateTime? AttendedTime { get; set; }
}