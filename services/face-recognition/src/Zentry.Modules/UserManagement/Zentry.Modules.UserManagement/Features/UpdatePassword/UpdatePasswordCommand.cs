using MediatR;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.UserManagement.Features.UpdatePassword;

public class UpdatePasswordCommand(Guid userId, string newPassword) : ICommand<Unit>
{
    public Guid UserId { get; } = userId;
    public string NewPassword { get; } = newPassword;
}