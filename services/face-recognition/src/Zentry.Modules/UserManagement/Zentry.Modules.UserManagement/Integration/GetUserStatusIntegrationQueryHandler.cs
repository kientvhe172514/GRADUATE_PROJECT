using Zentry.Modules.UserManagement.Interfaces;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.User;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.UserManagement.Integration;

public class GetUserStatusIntegrationQueryHandler(IUserRepository userRepository)
    : IQueryHandler<GetUserStatusIntegrationQuery, GetUserStatusIntegrationResponse>
{
    public async Task<GetUserStatusIntegrationResponse> Handle(
        GetUserStatusIntegrationQuery integrationQuery,
        CancellationToken cancellationToken)
    {
        var account = await userRepository.GetAccountByUserId(integrationQuery.UserId);

        if (account is null) throw new ResourceNotFoundException("Account", integrationQuery.UserId);

        return new GetUserStatusIntegrationResponse(account.Status);
    }
}