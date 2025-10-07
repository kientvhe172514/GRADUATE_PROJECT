using MediatR;
using Microsoft.Extensions.Logging;
using Zentry.Modules.UserManagement.Interfaces;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.User;
using Zentry.SharedKernel.Contracts.Schedule;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.UserManagement.Features.UpdateUserStatus;

public class UpdateUserStatusCommandHandler(
    IUserRepository userRepository,
    IMediator mediator,
    ILogger<UpdateUserStatusCommandHandler> logger)
    : ICommandHandler<UpdateUserStatusCommand, UpdateUserStatusResponse>
{
    public async Task<UpdateUserStatusResponse> Handle(UpdateUserStatusCommand command,
        CancellationToken cancellationToken)
    {
        logger.LogInformation("Starting user status update for UserId: {UserId} to Status: {Status}",
            command.UserId, command.Request.Status);

        var user = await userRepository.GetByIdAsync(command.UserId, cancellationToken);
        if (user is null)
        {
            logger.LogWarning("User not found with ID: {UserId}", command.UserId);
            throw new ResourceNotFoundException("USER", command.UserId.ToString());
        }

        var account = await userRepository.GetAccountById(user.AccountId);
        if (account is null)
        {
            logger.LogWarning("Account not found with ID: {AccountId} for User: {UserId}",
                user.AccountId, command.UserId);
            throw new ResourceNotFoundException("ACCOUNT", user.AccountId.ToString());
        }

        AccountStatus newStatus;
        try
        {
            newStatus = AccountStatus.FromName(command.Request.Status);
        }
        catch (InvalidOperationException)
        {
            logger.LogWarning("Invalid status value provided: {Status}", command.Request.Status);
            throw new BusinessRuleException("INVALID_STATUS", $"Invalid status value '{command.Request.Status}'.");
        }

        if (Equals(account.Status, newStatus))
        {
            logger.LogInformation("User {UserId} already has status {Status}, no update needed",
                command.UserId, command.Request.Status);
            return new UpdateUserStatusResponse
            {
                Success = true,
                Message = "User status is already up to date."
            };
        }

        var originalStatus = account.Status;
        logger.LogInformation("Updating user {UserId} status from {OldStatus} to {NewStatus}",
            command.UserId, originalStatus.ToString(), newStatus.ToString());

        var needsEnrollmentRemoval = !Equals(newStatus, AccountStatus.Active);

        try
        {
            account.UpdateStatus(newStatus);
            await userRepository.UpdateAccountAsync(account, cancellationToken);

            logger.LogDebug("Account status updated successfully for User: {UserId}", command.UserId);

            if (needsEnrollmentRemoval)
            {
                logger.LogInformation("User {UserId} is being set to inactive status, removing enrollments",
                    command.UserId);
                if (Equals(account.Role, Role.Student))
                {
                    var enrollmentResponse = await mediator.Send(
                        new RemoveStudentEnrollmentIntegrationCommand(user.Id),
                        cancellationToken);

                    if (!enrollmentResponse.Success)
                    {
                        logger.LogError(
                            "Failed to remove enrollments for User: {UserId}. Error: {Error}. Rolling back account status",
                            command.UserId, enrollmentResponse.Message);

                        try
                        {
                            account.UpdateStatus(originalStatus);
                            await userRepository.UpdateAccountAsync(account, cancellationToken);
                            logger.LogInformation("Successfully rolled back account status for User: {UserId}",
                                command.UserId);
                        }
                        catch (Exception rollbackEx)
                        {
                            logger.LogCritical(rollbackEx,
                                "CRITICAL: Failed to rollback account status for User: {UserId}. Manual intervention required!",
                                command.UserId);
                        }

                        throw new BusinessRuleException("ENROLLMENT_REMOVAL_FAILED",
                            $"Failed to remove user enrollments: {enrollmentResponse.Message}");
                    }

                    logger.LogInformation("Successfully removed enrollments for User: {UserId}", command.UserId);
                }
            }

            logger.LogInformation("Successfully updated user {UserId} status to {Status}",
                command.UserId, newStatus.ToString());

            return new UpdateUserStatusResponse
            {
                Success = true,
                Message = "User status updated successfully."
            };
        }
        catch (BusinessRuleException)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unexpected error occurred while updating user {UserId} status. Attempting rollback",
                command.UserId);

            try
            {
                account.UpdateStatus(originalStatus);
                await userRepository.UpdateAccountAsync(account, cancellationToken);
                logger.LogInformation(
                    "Successfully rolled back account status for User: {UserId} due to unexpected error",
                    command.UserId);
            }
            catch (Exception rollbackEx)
            {
                logger.LogCritical(rollbackEx,
                    "CRITICAL: Failed to rollback account status for User: {UserId} after unexpected error. Manual intervention required!",
                    command.UserId);
            }

            throw;
        }
    }
}