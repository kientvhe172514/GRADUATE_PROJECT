using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.User;

namespace Zentry.SharedKernel.Contracts.User;

public record GetUserStatusIntegrationQuery(Guid UserId)
    : IQuery<GetUserStatusIntegrationResponse>;

public record GetUserStatusIntegrationResponse(AccountStatus Status);