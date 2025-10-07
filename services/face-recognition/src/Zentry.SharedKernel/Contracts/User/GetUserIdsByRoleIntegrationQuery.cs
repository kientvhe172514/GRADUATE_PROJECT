using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.User;

namespace Zentry.SharedKernel.Contracts.User;

public record GetUserIdsByRoleIntegrationQuery(Role Role) : IQuery<GetUserIdsByRoleIntegrationResponse>;

public record GetUserIdsByRoleIntegrationResponse(List<Guid> UserIds);