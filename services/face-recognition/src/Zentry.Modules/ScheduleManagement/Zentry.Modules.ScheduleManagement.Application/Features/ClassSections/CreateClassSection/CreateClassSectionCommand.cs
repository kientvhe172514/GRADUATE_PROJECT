using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.ClassSections.CreateClassSection;

public record CreateClassSectionCommand(
    Guid CourseId,
    string SectionCode,
    string Semester
) : ICommand<CreateClassSectionResponse>;

public record CreateClassSectionResponse(Guid Id);