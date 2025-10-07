using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Schedule;

public record GetClassSectionByScheduleIdIntegrationQuery(Guid ScheduleId)
    : IQuery<GetClassSectionByScheduleIdIntegrationResponse>;

public record GetClassSectionByScheduleIdIntegrationResponse
{
    public Guid ClassSectionId { get; init; }
    public Guid CourseId { get; init; }
    public string CourseCode { get; init; } = string.Empty;
    public string CourseName { get; init; } = string.Empty;
    public string SectionCode { get; init; } = string.Empty;
}