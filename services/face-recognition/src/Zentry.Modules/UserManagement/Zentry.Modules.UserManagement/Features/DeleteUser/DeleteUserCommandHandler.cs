using Zentry.Modules.UserManagement.Interfaces;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.User;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.UserManagement.Features.DeleteUser;

public class DeleteUserCommandHandler(IUserRepository userRepository)
    : ICommandHandler<DeleteUserCommand, DeleteUserResponse>
{
    public async Task<DeleteUserResponse> Handle(DeleteUserCommand command, CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByIdAsync(command.UserId, cancellationToken);
        if (user is null) throw new ResourceNotFoundException("USER", command.UserId);

        var account = user.Account;
        if (account is null || !Equals(account.Status, AccountStatus.Active))
            throw new ResourceNotFoundException("USER", command.UserId);

        await userRepository.SoftDeleteUserAsync(command.UserId, cancellationToken);
        return new DeleteUserResponse { Success = true, Message = "User soft deleted successfully." };
    }
}