using MediatR;
using Microsoft.Extensions.Logging;
using Zentry.Modules.UserManagement.Interfaces;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.UserManagement.Features.UpdatePassword;

public class UpdatePasswordCommandHandler(
    IUserRepository userRepository,
    IPasswordHasher passwordHasher,
    ILogger<UpdatePasswordCommandHandler> logger)
    : ICommandHandler<UpdatePasswordCommand>
{
    public async Task<Unit> Handle(UpdatePasswordCommand command, CancellationToken cancellationToken)
    {
        logger.LogInformation("Handling password update for user {UserId}", command.UserId);

        var user = await userRepository.GetByIdAsync(command.UserId, cancellationToken);
        if (user is null)
        {
            logger.LogWarning("User with ID {UserId} not found.", command.UserId);
            throw new ResourceNotFoundException("USER", command.UserId);
        }

        var account = await userRepository.GetAccountById(user.AccountId);
        if (account is null)
        {
            logger.LogWarning("Associated account for user {UserId} not found.", command.UserId);
            throw new ResourceNotFoundException("ACCOUNT", user.AccountId);
        }

        var (newPasswordHash, newPasswordSalt) = passwordHasher.HashPassword(command.NewPassword);
        account.SetNewPassword(newPasswordHash, newPasswordSalt);

        await userRepository.UpdateAccountAsync(account, cancellationToken);

        logger.LogInformation("Password for user {UserId} updated successfully.", command.UserId);
        return Unit.Value;
    }
}