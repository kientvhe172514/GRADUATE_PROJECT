using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Courses.GetCourseById;

public record GetCourseByIdQuery(Guid Id)
    : IQuery<CourseDto>;