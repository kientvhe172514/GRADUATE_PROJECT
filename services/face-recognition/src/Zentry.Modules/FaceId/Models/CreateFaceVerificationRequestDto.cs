namespace Zentry.Modules.FaceId.Models;

public class CreateFaceVerificationRequestDto
{
    public int LecturerId { get; set; }
    public Guid SessionId { get; set; }
    public Guid? ClassSectionId { get; set; }
    public List<int>? RecipientUserIds { get; set; }
    public int? ExpiresInMinutes { get; set; }
    public string? Title { get; set; }
    public string? Body { get; set; }
}
