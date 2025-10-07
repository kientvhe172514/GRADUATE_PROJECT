using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Courses.GetTotalCourseCount;

public class GetTotalCourseCountQueryHandler(ICourseRepository courseRepository)
    : IQueryHandler<GetTotalCourseCountQuery, int>
{
    public async Task<int> Handle(GetTotalCourseCountQuery request, CancellationToken cancellationToken)
    {
        return await courseRepository.CountTotalCoursesAsync(cancellationToken);
    }
}