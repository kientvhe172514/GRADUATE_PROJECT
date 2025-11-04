namespace Zentry.Modules.FaceId.Models;

public class CreateFaceVerificationRequestDto
{
    public Guid LecturerId { get; set; }
    public Guid SessionId { get; set; }
    public Guid? ClassSectionId { get; set; }
    public List<Guid>? RecipientUserIds { get; set; }
    public int? ExpiresInMinutes { get; set; }
    public string? Title { get; set; }
    public string? Body { get; set; }
}
