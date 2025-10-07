using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Configuration;

public record GetUserAttributesForUsersIntegrationQuery(List<Guid> UserIds)
    : IQuery<GetUserAttributesForUsersIntegrationResponse>;

public record GetUserAttributesForUsersIntegrationResponse(
    Dictionary<Guid, Dictionary<string, string>> UserAttributes
);