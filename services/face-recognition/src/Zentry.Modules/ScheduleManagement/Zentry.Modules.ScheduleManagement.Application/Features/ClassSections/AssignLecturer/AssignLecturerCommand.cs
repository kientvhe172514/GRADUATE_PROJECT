using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.ClassSections.AssignLecturer;

public record AssignLecturerCommand(Guid ClassSectionId, Guid LecturerId) : ICommand<AssignLecturerResponse>;

public record AssignLecturerResponse(Guid ClassSectionId, Guid LecturerId, bool Success);