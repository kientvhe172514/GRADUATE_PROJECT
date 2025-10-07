using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Courses.GetCourseById;

public class GetCourseByIdQueryHandler(ICourseRepository courseRepository)
    : IQueryHandler<GetCourseByIdQuery, CourseDto>
{
    public async Task<CourseDto> Handle(GetCourseByIdQuery query, CancellationToken cancellationToken)
    {
        var course = await courseRepository.GetByIdAsync(query.Id, cancellationToken);
        if (course is null)
            throw new ResourceNotFoundException("Course", query.Id);
        var courseDetailDto = new CourseDto
        {
            Id = course.Id,
            Code = course.Code,
            Name = course.Name,
            Description = course.Description,
            CreatedAt = course.CreatedAt,
            UpdatedAt = course.UpdatedAt
        };

        return courseDetailDto;
    }
}