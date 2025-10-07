using Microsoft.Extensions.Logging;
using Zentry.Modules.UserManagement.Interfaces;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.User;

namespace Zentry.Modules.UserManagement.Integration;

public class GetUserRolesQueryHandler(IUserRepository userRepository, ILogger<GetUserRolesQueryHandler> logger)
    : IQueryHandler<GetUserRolesIntegrationQuery, GetUserRolesIntegrationResponse>
{
    public async Task<GetUserRolesIntegrationResponse> Handle(GetUserRolesIntegrationQuery request,
        CancellationToken cancellationToken)
    {
        logger.LogInformation("Attempting to get roles for {Count} UserIds.", request.UserIds.Count);

        // Gọi UserRepository để lấy vai trò của nhiều người dùng cùng lúc
        var userRoles = await userRepository.GetUserRolesByUserIdsAsync(request.UserIds, cancellationToken);

        // Chuyển đổi List<Tuple<Guid, Role>> (hoặc tương tự) sang Dictionary<Guid, string>
        var userRolesMap = userRoles.ToDictionary(
            ur => ur.UserId,
            ur => ur.Role.ToString()); // Chắc chắn Role là Smart Enum và có ToString()

        logger.LogInformation("Successfully retrieved roles for {Count} UserIds.", userRolesMap.Count);

        return new GetUserRolesIntegrationResponse(userRolesMap);
    }
}