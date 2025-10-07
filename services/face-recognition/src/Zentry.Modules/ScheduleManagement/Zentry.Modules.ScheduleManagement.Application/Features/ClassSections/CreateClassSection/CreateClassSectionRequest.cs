namespace Zentry.Modules.ScheduleManagement.Application.Features.ClassSections.CreateClassSection;

public class CreateClassSectionRequest
{
    public Guid CourseId { get; init; }
    public string SectionCode { get; init; } = default!;
    public string Semester { get; init; } = default!;
}