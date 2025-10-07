using MediatR;
using Zentry.Modules.DeviceManagement.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.User;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.DeviceManagement.Features.GetDeviceById;

public class GetDeviceByIdQueryHandler(
    IDeviceRepository deviceRepository,
    IMediator mediator
) : IQueryHandler<GetDeviceByIdQuery, GetDeviceDetailsResponse>
{
    public async Task<GetDeviceDetailsResponse> Handle(GetDeviceByIdQuery request,
        CancellationToken cancellationToken)
    {
        var device = await deviceRepository.GetByIdAsync(request.DeviceId, cancellationToken);

        if (device is null) throw new NotFoundException(nameof(GetDeviceByIdQueryHandler), request.DeviceId);

        // too fucking lazy to create a new integration handler
        var userInfo =
            await mediator.Send(new GetUserByIdAndRoleIntegrationQuery(device.UserId, null), cancellationToken);

        return new GetDeviceDetailsResponse
        {
            DeviceId = device.Id,
            UserId = device.UserId,
            UserFullName = userInfo?.FullName,
            UserEmail = userInfo?.Email,
            DeviceName = device.DeviceName.Value,
            AndroidId = device.AndroidId.Value,
            DeviceToken = device.DeviceToken.Value,
            Platform = device.Platform,
            OsVersion = device.OsVersion,
            Model = device.Model,
            Manufacturer = device.Manufacturer,
            AppVersion = device.AppVersion,
            PushNotificationToken = device.PushNotificationToken,
            CreatedAt = device.CreatedAt,
            UpdatedAt = device.UpdatedAt,
            LastVerifiedAt = device.LastVerifiedAt,
            Status = device.Status.ToString()
        };
    }
}