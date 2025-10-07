namespace Zentry.Modules.UserManagement.Dtos;

public class UserRequestDto
{
    public Guid Id { get; set; }
    public Guid RequestedByUserId { get; set; }

    // Thêm các thuộc tính mới
    public string? RequestedByUserEmail { get; set; }
    public string? RequestedByUserName { get; set; }

    public Guid TargetUserId { get; set; }

    // Thêm các thuộc tính mới
    public string? TargetUserEmail { get; set; }
    public string? TargetUserName { get; set; }

    public string RequestType { get; set; } = string.Empty;
    public Guid RelatedEntityId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
}