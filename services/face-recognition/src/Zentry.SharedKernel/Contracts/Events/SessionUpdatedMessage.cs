namespace Zentry.SharedKernel.Contracts.Events;

public record SessionUpdatedMessage(
    Guid SessionId,
    Guid ScheduleId,
    DateTime StartTime,
    DateTime EndTime,
    int? TotalAttendanceRounds,
    Guid? OldLecturerId,
    Guid? NewLecturerId,
    bool TimestampsChanged
);

public record UpdateRoundsForSessionMessage(
    Guid SessionId,
    DateTime StartTime,
    DateTime EndTime,
    int TotalAttendanceRounds
);