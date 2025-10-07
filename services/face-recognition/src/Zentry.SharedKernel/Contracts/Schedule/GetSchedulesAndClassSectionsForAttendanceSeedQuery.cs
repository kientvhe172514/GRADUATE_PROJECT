using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Schedule;

public record GetSchedulesAndClassSectionsForAttendanceSeedQuery
    : IQuery<GetSchedulesAndClassSectionsForAttendanceSeedResponse>;

public record GetSchedulesAndClassSectionsForAttendanceSeedResponse(
    List<SeededScheduleDto> Schedules,
    List<SeededClassSectionDto> ClassSections
);

public record SeededScheduleDto
{
    public Guid Id { get; init; }
    public Guid ClassSectionId { get; init; }
    public Guid RoomId { get; init; }
    public string WeekDay { get; init; }
    public TimeOnly StartTime { get; init; }
    public TimeOnly EndTime { get; init; }
    public DateOnly StartDate { get; init; }
    public DateOnly EndDate { get; init; }
}

public record SeededClassSectionDto
{
    public Guid Id { get; init; }
    public Guid CourseId { get; init; }
    public Guid? LecturerId { get; init; }
}