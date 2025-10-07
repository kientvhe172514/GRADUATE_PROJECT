using Zentry.SharedKernel.Abstractions.Application;

// Đảm bảo using này có mặt

namespace Zentry.Modules.UserManagement.Features.GetUser;

// Query để lấy thông tin chi tiết người dùng
public class GetUserQuery(Guid userId) : IQuery<GetUserResponse>
{
    public Guid UserId { get; init; } = userId;
}