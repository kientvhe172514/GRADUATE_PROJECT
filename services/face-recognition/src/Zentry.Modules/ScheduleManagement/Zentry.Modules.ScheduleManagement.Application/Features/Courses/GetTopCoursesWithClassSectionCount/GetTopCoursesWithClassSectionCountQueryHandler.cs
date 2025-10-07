using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Courses.GetTopCoursesWithClassSectionCount;

public class GetTopCoursesWithClassSectionCountQueryHandler(
    IClassSectionRepository classSectionRepository
) : IQueryHandler<GetTopCoursesWithClassSectionCountQuery, List<CourseWithClassSectionCountDto>>
{
    public async Task<List<CourseWithClassSectionCountDto>> Handle(
        GetTopCoursesWithClassSectionCountQuery request,
        CancellationToken cancellationToken)
    {
        var topCourses =
            await classSectionRepository.GetTopCoursesWithClassSectionCountAsync(request.Count, cancellationToken);

        return topCourses;
    }
}