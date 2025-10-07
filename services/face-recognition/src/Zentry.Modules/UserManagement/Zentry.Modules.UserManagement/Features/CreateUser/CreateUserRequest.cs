namespace Zentry.Modules.UserManagement.Features.CreateUser;

public class CreateUserRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string Role { get; set; } = "User";
    public Dictionary<string, string>? Attributes { get; set; } = new();
}