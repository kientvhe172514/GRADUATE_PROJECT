using Zentry.SharedKernel.Abstractions.Application;

// Đảm bảo using này có mặt

namespace Zentry.Modules.UserManagement.Features.UpdateUser;

// Chỉ cần kế thừa ICommand của bạn
public class UpdateUserCommand(Guid userId, UpdateUserRequest request)
    : ICommand<UpdateUserResponse>
{
    public Guid UserId { get; init; } = userId;
    public string? FullName { get; init; } = request.FullName;
    public string? PhoneNumber { get; init; } = request.PhoneNumber;
    public string? Role { get; init; } = request.Role;
}

public class UpdateUserResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}