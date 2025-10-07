using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.ClassSections.UpdateClassSection;

public record UpdateClassSectionCommand(
    Guid Id,
    string? SectionCode,
    string? Semester
) : ICommand<bool>;