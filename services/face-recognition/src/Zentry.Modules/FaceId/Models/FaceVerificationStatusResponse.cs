namespace Zentry.Modules.FaceId.Models;

public class FaceVerificationStatusResponse
{
    public required Guid RequestId { get; init; }
    public required Guid SessionId { get; init; }
    public required DateTime ExpiresAt { get; init; }
    public required int TotalRecipients { get; init; }
    public required int TotalVerified { get; init; }
    public required List<Guid> VerifiedUserIds { get; init; }
}
