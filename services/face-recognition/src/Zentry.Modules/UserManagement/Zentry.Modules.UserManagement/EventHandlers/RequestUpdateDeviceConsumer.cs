using MassTransit;
using Microsoft.Extensions.Logging;
using Zentry.Modules.UserManagement.Entities;
using Zentry.Modules.UserManagement.Interfaces;
using Zentry.SharedKernel.Constants.Attendance;
using Zentry.SharedKernel.Contracts.Events;

namespace Zentry.Modules.UserManagement.EventHandlers;

public class RequestUpdateDeviceConsumer(
    IUserRequestRepository userRequestRepository,
    ILogger<RequestUpdateDeviceConsumer> logger) : IConsumer<RequestUpdateDeviceMessage>
{
    public async Task Consume(ConsumeContext<RequestUpdateDeviceMessage> context)
    {
        var message = context.Message;
        logger.LogInformation(
            "Received RequestUpdateDeviceMessage for user {RequestedByUserId}, new device {NewDeviceId}.",
            message.RequestedByUserId, message.NewDeviceId);

        var userRequest = UserRequest.Create(
            message.RequestedByUserId,
            message.RequestedByUserId,
            RequestType.FromName(message.RequestType),
            message.NewDeviceId,
            message.Reason
        );

        await userRequestRepository.AddAsync(userRequest, context.CancellationToken);
        await userRequestRepository.SaveChangesAsync(context.CancellationToken);

        logger.LogInformation(
            "UserRequest {UserRequestId} created for device change of user {RequestedByUserId} related to device {NewDeviceId}.",
            userRequest.Id, message.RequestedByUserId, message.NewDeviceId);

        // TODO: (Optional) Publish một event khác để kích hoạt thông báo cho Admin (nếu có Notification Module)
        // await context.Publish(new UserRequestCreatedEvent(...), context.CancellationToken);
    }
}