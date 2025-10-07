namespace Zentry.Modules.FaceId.Dtos;

public class UserFaceIdStatusDto
{
    public UserFaceIdStatusDto(Guid userId, bool hasFaceId, DateTime? createdAt = null, DateTime? updatedAt = null)
    {
        UserId = userId;
        HasFaceId = hasFaceId;
        CreatedAt = createdAt;
        UpdatedAt = updatedAt;
    }

    public Guid UserId { get; set; }
    public bool HasFaceId { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}