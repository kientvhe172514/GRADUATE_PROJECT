using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Attendance;

namespace Zentry.SharedKernel.Contracts.User;

public record CreateUserRequestIntegrationCommand(
    Guid RequestedByUserId,
    Guid? TargetUserId,
    RequestType RequestType,
    Guid RelatedEntityId,
    string Reason
) : ICommand<CreateUserRequestIntegrationResponse>;

public record CreateUserRequestIntegrationResponse(Guid UserRequestId);