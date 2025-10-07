namespace Zentry.SharedKernel.Contracts.Events;

public record AssignLecturerToWhitelistMessage(
    Guid ScheduleId,
    Guid? LecturerId = null
);