using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.UserManagement.Features.DeleteUser;

public class DeleteUserCommand(Guid userId) : ICommand<DeleteUserResponse>
{
    public Guid UserId { get; init; } = userId;
}

public class DeleteUserResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}