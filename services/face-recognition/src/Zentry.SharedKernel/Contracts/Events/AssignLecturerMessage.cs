namespace Zentry.SharedKernel.Contracts.Events;

public record AssignLecturerMessage(
    Guid ClassSectionId,
    Guid LecturerId
);