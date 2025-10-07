using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Schedule;

public record RemoveLecturerFromClassSectionIntegrationCommand(Guid LecturerId)
    : ICommand<RemoveLecturerFromClassSectionIntegrationResponse>;

public record RemoveLecturerFromClassSectionIntegrationResponse(
    bool Success,
    string Message
);