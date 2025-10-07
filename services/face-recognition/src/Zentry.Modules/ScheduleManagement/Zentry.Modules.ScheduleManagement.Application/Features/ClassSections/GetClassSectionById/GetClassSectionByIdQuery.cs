using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.ClassSections.GetClassSectionById;

public record GetClassSectionByIdQuery(Guid Id)
    : IQuery<ClassSectionDto>;