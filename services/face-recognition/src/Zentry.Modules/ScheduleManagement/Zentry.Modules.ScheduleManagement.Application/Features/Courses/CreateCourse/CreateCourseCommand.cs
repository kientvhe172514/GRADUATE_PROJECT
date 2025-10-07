using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Courses.CreateCourse;

public record CreateCourseCommand(
    string Name,
    string Code,
    string Description
) : ICommand<CourseCreatedResponse>;

public class CourseCreatedResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}