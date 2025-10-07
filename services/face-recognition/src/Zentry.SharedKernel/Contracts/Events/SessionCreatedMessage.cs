namespace Zentry.SharedKernel.Contracts.Events;

public record SessionCreatedMessage(
    Guid SessionId,
    Guid ScheduleId,
    DateTime StartTime,
    DateTime EndTime,
    int SessionNumber,
    DateTime CreatedAt
);