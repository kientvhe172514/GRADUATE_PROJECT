using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.User;

public record GetUserRolesIntegrationQuery(List<Guid> UserIds) : IQuery<GetUserRolesIntegrationResponse>;

public record GetUserRolesIntegrationResponse(
    Dictionary<Guid, string> UserRolesMap
);