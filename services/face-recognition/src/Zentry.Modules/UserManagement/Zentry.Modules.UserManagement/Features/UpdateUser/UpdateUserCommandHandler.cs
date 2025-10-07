using Zentry.Modules.UserManagement.Interfaces;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.User;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.UserManagement.Features.UpdateUser;

public class UpdateUserCommandHandler(IUserRepository userRepository)
    : ICommandHandler<UpdateUserCommand, UpdateUserResponse>
{
    public async Task<UpdateUserResponse> Handle(UpdateUserCommand command, CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByIdAsync(command.UserId, cancellationToken);
        if (user is null)
            throw new ResourceNotFoundException("USER", command.UserId);

        var account = await userRepository.GetAccountById(user.AccountId);
        if (account is null)
            throw new ResourceNotFoundException("USER", command.UserId);

        if (command.PhoneNumber != null)
            if (await userRepository.IsPhoneNumberExist(command.UserId, command.PhoneNumber, cancellationToken))
                throw new ResourceAlreadyExistsException("USER Phone Number", command.PhoneNumber);

        user.UpdateUser(command.FullName, command.PhoneNumber);

        if (!string.IsNullOrWhiteSpace(command.Role)) account.UpdateAccount(role: Role.FromName(command.Role));

        await userRepository.UpdateAsync(user, cancellationToken);
        await userRepository.UpdateAccountAsync(account, cancellationToken);

        return new UpdateUserResponse { Success = true, Message = "User updated successfully." };
    }
}