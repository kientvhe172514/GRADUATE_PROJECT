using Zentry.Modules.AttendanceManagement.Domain.ValueObjects;

namespace Zentry.Modules.AttendanceManagement.Domain.Entities;

public class RoundTrack
{
    public RoundTrack()
    {
    }

    public RoundTrack(Guid roundId, Guid sessionId, int roundNumber, DateTime startedAt)
    {
        Id = roundId;
        SessionId = sessionId;
        RoundNumber = roundNumber;
        StartedAt = startedAt;
    }

    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public int RoundNumber { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }

    public List<StudentAttendanceInRound> Students { get; set; } = [];
}