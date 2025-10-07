using MediatR;
using Zentry.SharedKernel.Constants.User;
using Zentry.SharedKernel.Contracts.User;

namespace Zentry.Modules.ScheduleManagement.Application.Services;

public class UserScheduleService(IMediator mediator) : IUserScheduleService
{
    public async Task<GetUserByIdAndRoleIntegrationResponse?> GetUserByIdAndRoleAsync(Role role, Guid userId,
        CancellationToken cancellationToken)
    {
        var query = new GetUserByIdAndRoleIntegrationQuery(userId, role);
        var result = await mediator.Send(query, cancellationToken);
        return result;
    }
}