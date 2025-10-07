using MediatR;
using Zentry.Modules.DeviceManagement.Abstractions;
using Zentry.SharedKernel.Contracts.User;

namespace Zentry.Modules.DeviceManagement.Services;

public class UserDeviceService(IMediator mediator) : IUserDeviceService
{
    public async Task<bool> CheckUserExistsAsync(Guid userId, CancellationToken cancellationToken)
    {
        var query = new CheckUserExistIntegrationQuery(userId);
        var result = await mediator.Send(query, cancellationToken);
        return result.IsExist;
    }
}