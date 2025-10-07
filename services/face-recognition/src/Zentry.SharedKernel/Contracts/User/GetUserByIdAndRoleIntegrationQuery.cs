using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.User;

namespace Zentry.SharedKernel.Contracts.User;

public record GetUserByIdAndRoleIntegrationQuery(Guid UserId, Role? Role)
    : IQuery<GetUserByIdAndRoleIntegrationResponse>;

public record GetUserByIdAndRoleIntegrationResponse(
    Guid UserId,
    Guid AccountId,
    string Email,
    string FullName,
    string? PhoneNumber,
    Role Role,
    string Status,
    DateTime CreatedAt,
    Dictionary<string, string> Attributes
);