using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Courses.DeleteCourse;

public record DeleteCourseCommand(Guid Id) : ICommand<bool>;