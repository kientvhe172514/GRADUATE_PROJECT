using System.ComponentModel.DataAnnotations;
using Zentry.SharedKernel.Constants.Attendance;
using Zentry.SharedKernel.Domain;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.AttendanceManagement.Domain.Entities;

public class Round : AggregateRoot<Guid>
{
    private Round() : base(Guid.Empty)
    {
    }

    private Round(Guid id, Guid sessionId, int roundNumber, DateTime startTime, DateTime endTime, RoundStatus status)
        : base(id)
    {
        SessionId = sessionId;
        RoundNumber = roundNumber;
        StartTime = startTime;
        EndTime = endTime;
        Status = status;
        CreatedAt = DateTime.UtcNow;
    }

    [Required] public Guid SessionId { get; private set; }

    public int RoundNumber { get; private set; }

    [Required] public DateTime StartTime { get; private set; }

    [Required] public DateTime EndTime { get; private set; }

    [Required] public RoundStatus Status { get; private set; }

    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }
    public virtual Session Session { get; set; }

    public static Round Create(Guid sessionId, int roundNumber, DateTime startTime, DateTime endTime)
    {
        return new Round(Guid.NewGuid(), sessionId, roundNumber, startTime, endTime, RoundStatus.Pending);
    }

    public void CompleteRound()
    {
        Status = RoundStatus.Completed;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateStatus(RoundStatus newStatus)
    {
        Status = newStatus;
        UpdatedAt = DateTime.UtcNow;
    }

    public void CancelRound()
    {
        if (!Equals(Status, RoundStatus.Active))
            throw new BusinessRuleException("ONLY_CANCEL_PENDING_ROUND", "Chỉ có thể cancel round đang pending.");

        Status = RoundStatus.Cancelled;
        UpdatedAt = DateTime.UtcNow;
    }
}