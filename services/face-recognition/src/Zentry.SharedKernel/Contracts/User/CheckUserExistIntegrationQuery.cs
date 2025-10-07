using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.User;

public record CheckUserExistIntegrationQuery(Guid UserId) : IQuery<CheckUserExistIntegrationResponse>;

public record CheckUserExistIntegrationResponse(bool IsExist);