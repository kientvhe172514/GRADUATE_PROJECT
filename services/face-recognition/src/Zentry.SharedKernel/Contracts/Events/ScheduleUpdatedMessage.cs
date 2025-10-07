namespace Zentry.SharedKernel.Contracts.Events;

public record ScheduleUpdatedMessage(
    Guid ScheduleId,
    TimeOnly? StartTime,
    TimeOnly? EndTime
);