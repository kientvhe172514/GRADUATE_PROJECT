using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Courses.DeleteCourse;

public class DeleteCourseCommandHandler(
    ICourseRepository courseRepository,
    IClassSectionRepository classSectionRepository,
    IScheduleRepository scheduleRepository)
    : ICommandHandler<DeleteCourseCommand, bool>
{
    public async Task<bool> Handle(DeleteCourseCommand command, CancellationToken cancellationToken)
    {
        var course = await courseRepository.GetByIdAsync(command.Id, cancellationToken);

        if (course is null) throw new ResourceNotFoundException("Course", command.Id);
        if (await classSectionRepository.IsExistClassSectionByCourseIdAsync(course.Id, cancellationToken))
        {
            if (await scheduleRepository.HasActiveScheduleInTermAsync(course.Id, cancellationToken))
                throw new ResourceCannotBeDeletedException($"Course with ID '{command.Id}' can not be deleted.");

            await courseRepository.SoftDeleteAsync(command.Id, cancellationToken);
        }
        else
        {
            await courseRepository.DeleteAsync(course, cancellationToken);
        }

        return true;
    }
}