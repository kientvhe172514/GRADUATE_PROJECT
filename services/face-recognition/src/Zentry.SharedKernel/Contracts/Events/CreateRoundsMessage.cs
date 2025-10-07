namespace Zentry.SharedKernel.Contracts.Events;

public record CreateRoundsMessage(
    Guid SessionId,
    int TotalAttendanceRounds,
    DateTime ScheduledStartTime,
    DateTime ScheduledEndTime
);