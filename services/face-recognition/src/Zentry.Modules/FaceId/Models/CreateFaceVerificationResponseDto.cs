namespace Zentry.Modules.FaceId.Models;

public class CreateFaceVerificationResponseDto
{
    public required Guid RequestId { get; init; }
    public required Guid SessionId { get; init; }
    public required DateTime ExpiresAt { get; init; }
    public required int TotalRecipients { get; init; }
    public required float Threshold { get; init; }
}
