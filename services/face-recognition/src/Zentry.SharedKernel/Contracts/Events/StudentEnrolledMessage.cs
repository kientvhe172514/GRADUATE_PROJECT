namespace Zentry.SharedKernel.Contracts.Events;

public record StudentEnrolledMessage(
    Guid StudentId,
    Guid ClassSectionId,
    List<Guid> EnrolledStudentIds = null
);