using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Configuration;

public record GetUserAttributesIntegrationQuery(
    Guid UserId
) : IQuery<GetUserAttributesIntegrationResponse>;

public record GetUserAttributesIntegrationResponse(
    Dictionary<string, string> Attributes
);