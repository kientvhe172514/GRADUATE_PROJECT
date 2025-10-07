using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.User;

public record GetUserRoleIntegrationQuery(Guid UserId) : IQuery<GetUserRoleIntegrationResponse>;

public record GetUserRoleIntegrationResponse(
    Guid UserId,
    string Role
);