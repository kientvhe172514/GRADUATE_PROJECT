using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Schedule;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ScheduleManagement.Application.Integration;

public class GetCourseCodeIntegrationQueryHandler(ICourseRepository courseRepository)
    : IQueryHandler<GetCourseCodeIntegrationQuery, GetCourseCodeIntegrationResponse>
{
    public async Task<GetCourseCodeIntegrationResponse> Handle(GetCourseCodeIntegrationQuery request,
        CancellationToken cancellationToken)
    {
        var course = await courseRepository.GetByIdAsync(request.CourseId, cancellationToken);
        if (course is null) throw new NotFoundException("Course", request.CourseId);

        return new GetCourseCodeIntegrationResponse(course.Code);
    }
}