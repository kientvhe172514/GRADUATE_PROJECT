namespace Zentry.SharedKernel.Contracts.Events;

public record ScheduleDeletedMessage(
    Guid ScheduleId
);