using Microsoft.Extensions.Logging;
using Zentry.Modules.UserManagement.Entities;
using Zentry.Modules.UserManagement.Interfaces;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.User;

namespace Zentry.Modules.UserManagement.Integration;

public class CreateUserRequestIntegrationCommandHandler(
    IUserRequestRepository userRequestRepository,
    ILogger<CreateUserRequestIntegrationCommandHandler> logger)
    : ICommandHandler<CreateUserRequestIntegrationCommand, CreateUserRequestIntegrationResponse>
{
    public async Task<CreateUserRequestIntegrationResponse> Handle(
        CreateUserRequestIntegrationCommand command,
        CancellationToken cancellationToken)
    {
        logger.LogInformation("Creating user request from {RequestedByUserId} to {TargetUserId} for {RequestType}",
            command.RequestedByUserId, command.TargetUserId, command.RequestType);


        var userRequest = UserRequest.Create(
            command.RequestedByUserId,
            command.TargetUserId ?? Guid.Empty,
            command.RequestType,
            command.RelatedEntityId,
            command.Reason
        );

        await userRequestRepository.AddAsync(userRequest, cancellationToken);
        await userRequestRepository.SaveChangesAsync(cancellationToken);

        logger.LogInformation("User request created successfully with ID: {UserRequestId}", userRequest.Id);

        return new CreateUserRequestIntegrationResponse(userRequest.Id);
    }
}