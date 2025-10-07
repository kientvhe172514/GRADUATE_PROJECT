using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.Modules.ScheduleManagement.Domain.Entities;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Courses.CreateCourse;

public class CreateCourseCommandHandler(ICourseRepository courseRepository)
    : ICommandHandler<CreateCourseCommand, CourseCreatedResponse>
{
    public async Task<CourseCreatedResponse> Handle(CreateCourseCommand command, CancellationToken cancellationToken)
    {
        var isCodeUnique = await courseRepository.IsCodeUniqueAsync(command.Code, cancellationToken);
        if (!isCodeUnique)
            throw new ResourceAlreadyExistsException($"Course with code '{command.Code}' already exists.");

        var course = Course.Create(
            command.Code,
            command.Name,
            command.Description
        );

        await courseRepository.AddAsync(course, cancellationToken);
        await courseRepository.SaveChangesAsync(cancellationToken);

        var responseDto = new CourseCreatedResponse
        {
            Id = course.Id,
            Name = course.Name,
            Code = course.Code,
            Description = course.Description
        };

        return responseDto;
    }
}