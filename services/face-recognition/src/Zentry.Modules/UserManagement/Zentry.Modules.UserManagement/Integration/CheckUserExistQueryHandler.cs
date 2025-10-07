using Zentry.Modules.UserManagement.Interfaces;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.User;

namespace Zentry.Modules.UserManagement.Integration;

public class CheckUserExistQueryHandler(IUserRepository userRepository)
    : IQueryHandler<CheckUserExistIntegrationQuery, CheckUserExistIntegrationResponse>
{
    public async Task<CheckUserExistIntegrationResponse> Handle(CheckUserExistIntegrationQuery integrationQuery,
        CancellationToken cancellationToken)
    {
        var isExist = await userRepository.ExistsByIdAsync(integrationQuery.UserId, cancellationToken);
        return new CheckUserExistIntegrationResponse(isExist);
    }
}