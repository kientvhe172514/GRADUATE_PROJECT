using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.UserManagement.Features.CreateUser;

public class CreateUserCommand : ICommand<CreateUserResponse>
{
    public CreateUserCommand(CreateUserRequest request)
    {
        Email = request.Email;
        Password = request.Password;
        FullName = request.FullName;
        PhoneNumber = request.PhoneNumber;
        Role = request.Role;

        Attributes = request.Attributes;
    }

    public string Email { get; init; }
    public string Password { get; init; }
    public string FullName { get; init; }
    public string? PhoneNumber { get; init; }
    public string Role { get; init; }
    public Dictionary<string, string>? Attributes { get; init; }
}

public class CreateUserResponse
{
    public Guid UserId { get; set; }
    public Guid AccountId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Status { get; set; }
    public DateTime CreatedAt { get; set; }

    public Dictionary<string, string> Attributes { get; set; } = new();

    public List<string> SkippedAttributes { get; set; } = new();
}