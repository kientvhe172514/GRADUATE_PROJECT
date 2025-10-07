using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.ClassSections.DeleteClassSection;

public record DeleteClassSectionCommand(Guid Id) : ICommand<bool>;