// Trong Zentry.Modules.UserManagement.Integration

using MediatR;
using Zentry.Modules.UserManagement.Entities;
using Zentry.Modules.UserManagement.Interfaces;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.User;
using Zentry.SharedKernel.Contracts.Configuration;
using Zentry.SharedKernel.Contracts.User;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.UserManagement.Integration;

public class GetUserByIdAndRoleQueryHandler(IUserRepository userRepository, IMediator mediator)
    : IQueryHandler<GetUserByIdAndRoleIntegrationQuery, GetUserByIdAndRoleIntegrationResponse>
{
    public async Task<GetUserByIdAndRoleIntegrationResponse> Handle(
        GetUserByIdAndRoleIntegrationQuery integrationQuery,
        CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByIdAsync(integrationQuery.UserId, cancellationToken);
        if (user is null) throw new ResourceNotFoundException(nameof(User), integrationQuery.UserId);

        var account = await userRepository.GetAccountByUserId(integrationQuery.UserId);

        if (account is null) throw new ResourceNotFoundException(nameof(Account), integrationQuery.UserId);

        if (Equals(account.Status, AccountStatus.Locked)) throw new AccountLockedException(account.Id);

        if (Equals(account.Status, AccountStatus.Inactive)) throw new AccountInactiveException(account.Id);

        if (integrationQuery.Role != null && !Equals(account.Role, integrationQuery.Role))
            throw new ResourceNotFoundException(
                $"Role '{integrationQuery.Role}' not found for user",
                integrationQuery.UserId
            );

        var attributesQuery = new GetUserAttributesForUsersIntegrationQuery(new List<Guid> { integrationQuery.UserId });
        var attributesResponse = await mediator.Send(attributesQuery, cancellationToken);
        var userAttributes =
            attributesResponse.UserAttributes.GetValueOrDefault(integrationQuery.UserId,
                new Dictionary<string, string>());

        var response = new GetUserByIdAndRoleIntegrationResponse(
            user.Id,
            account.Id,
            account.Email,
            user.FullName,
            user.PhoneNumber,
            account.Role,
            account.Status.ToString(),
            account.CreatedAt,
            userAttributes
        );

        return response;
    }
}