using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Courses.UpdateCourse;

public class UpdateCourseCommand(Guid courseId, UpdateCourseRequest request)
    : ICommand<CourseDto>
{
    public Guid Id { get; init; } = courseId;
    public string? Name { get; init; } = request.Name;
    public string? Description { get; init; } = request.Description;
}