using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Schedule;

public record RemoveStudentEnrollmentIntegrationCommand(Guid StudentId)
    : ICommand<RemoveStudentEnrollmentIntegrationResponse>;

public record RemoveStudentEnrollmentIntegrationResponse(
    bool Success,
    string Message
);