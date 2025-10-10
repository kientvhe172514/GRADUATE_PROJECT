using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.ClassSections.GetAllClassSectionsWithEnrollmentCount;

public record GetAllClassSectionsWithEnrollmentCountQuery
    : IQuery<List<ClassSectionWithEnrollmentCountDto>>;