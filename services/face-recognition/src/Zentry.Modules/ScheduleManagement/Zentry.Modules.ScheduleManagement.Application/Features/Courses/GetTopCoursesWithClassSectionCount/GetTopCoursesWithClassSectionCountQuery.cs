using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Courses.GetTopCoursesWithClassSectionCount;

public record GetTopCoursesWithClassSectionCountQuery(int Count) : IQuery<List<CourseWithClassSectionCountDto>>;