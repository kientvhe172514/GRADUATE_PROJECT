using Zentry.Modules.UserManagement.Interfaces;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.User;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.UserManagement.Integration;

public class GetUserRoleQueryHandler(IUserRepository userRepository) // <-- Inject IUserRepository
    : IQueryHandler<GetUserRoleIntegrationQuery, GetUserRoleIntegrationResponse>
{
    public async Task<GetUserRoleIntegrationResponse> Handle(GetUserRoleIntegrationQuery request,
        CancellationToken cancellationToken)
    {
        var accountRole = await userRepository.GetUserRoleByUserIdAsync(request.UserId, cancellationToken);

        if (accountRole is null)
            throw new NotFoundException(nameof(GetUserRoleQueryHandler),
                $"Active role not found for user ID {request.UserId}.");

        return new GetUserRoleIntegrationResponse(request.UserId, accountRole.ToString());
    }
}