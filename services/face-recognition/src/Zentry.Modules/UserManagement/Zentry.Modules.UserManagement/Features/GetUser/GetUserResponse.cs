namespace Zentry.Modules.UserManagement.Features.GetUser;

public class GetUserResponse
{
    public Guid UserId { get; set; }
    public Guid AccountId { get; set; }
    public string? Code { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // Ví dụ: Active, Inactive
    public DateTime CreatedAt { get; set; }
    public bool HasFaceId { get; set; }
    public DateTime? FaceIdLastUpdated { get; set; }
}