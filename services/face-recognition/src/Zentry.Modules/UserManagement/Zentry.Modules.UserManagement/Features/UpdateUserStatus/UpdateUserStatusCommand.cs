using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.UserManagement.Features.UpdateUserStatus;

public record UpdateUserStatusCommand(Guid UserId, UpdateUserStatusRequest Request)
    : ICommand<UpdateUserStatusResponse>;

public class UpdateUserStatusResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}