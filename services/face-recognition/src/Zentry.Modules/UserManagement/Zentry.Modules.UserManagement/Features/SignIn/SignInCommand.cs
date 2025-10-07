using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.UserManagement.Features.SignIn;

public class SignInCommand : ICommand<SignInResponse>
{
    public string Email { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;
    // ✅ TẠM TẮT: DeviceToken để dễ test API
    // TODO: Bật lại khi cần production
    // public string DeviceToken { get; set; } = string.Empty;
}

public class SignInResponse
{
    public string Token { get; set; } = string.Empty; // ✅ JWT Access Token
    public string SessionKey { get; set; } = string.Empty; // ✅ Session Key (để tương thích)
    public UserInfo UserInfo { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
}

public class UserInfo
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}