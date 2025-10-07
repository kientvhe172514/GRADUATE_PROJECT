using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Schedule;

public record GetScheduleByIdIntegrationQuery(Guid Id) : IQuery<GetScheduleByIdIntegrationResponse>;

public class GetScheduleByIdIntegrationResponse
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public Guid RoomId { get; set; }
    public Guid? LecturerId { get; set; }
    public DateOnly ScheduledStartDate { get; set; }
    public DateOnly ScheduledEndDate { get; set; }
    public TimeOnly ScheduledStartTime { get; set; }
    public TimeOnly ScheduledEndTime { get; set; }
    public bool IsActive { get; set; }
}