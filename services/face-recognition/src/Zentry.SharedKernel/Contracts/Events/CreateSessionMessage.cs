namespace Zentry.SharedKernel.Contracts.Events;

public record CreateSessionMessage(
    Guid ScheduleId,
    Guid LecturerId,
    Guid ClassSectionId,
    Guid RoomId,
    string WeekDay,
    TimeOnly ScheduledStartTime,
    TimeOnly ScheduledEndTime,
    DateOnly ScheduledStartDate,
    DateOnly ScheduledEndDate,
    Guid CourseId,
    DateTime CreatedAt
);