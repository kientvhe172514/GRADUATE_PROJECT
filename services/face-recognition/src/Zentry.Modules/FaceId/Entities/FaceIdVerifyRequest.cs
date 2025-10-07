using Zentry.SharedKernel.Domain;

namespace Zentry.Modules.FaceId.Entities;

public class FaceIdVerifyRequest : AggregateRoot<Guid>
{
    private FaceIdVerifyRequest() : base(Guid.Empty)
    {
    }

    private FaceIdVerifyRequest(
        Guid id,
        Guid requestGroupId,
        Guid targetUserId,
        Guid? initiatorUserId,
        Guid? sessionId,
        Guid? classSectionId,
        float threshold,
        DateTime expiresAt)
        : base(id)
    {
        RequestGroupId = requestGroupId;
        TargetUserId = targetUserId;
        InitiatorUserId = initiatorUserId;
        SessionId = sessionId;
        ClassSectionId = classSectionId;
        Threshold = threshold;
        Status = FaceIdVerifyRequestStatus.Pending;
        CreatedAt = DateTime.UtcNow;
        ExpiresAt = expiresAt;
    }

    public Guid RequestGroupId { get; private set; }
    public Guid TargetUserId { get; private set; }
    public Guid? InitiatorUserId { get; private set; }
    public Guid? SessionId { get; private set; }
    public Guid? ClassSectionId { get; private set; }
    public float Threshold { get; private set; }
    public FaceIdVerifyRequestStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime ExpiresAt { get; private set; }
    public DateTime? CompletedAt { get; private set; }
    public bool? Matched { get; private set; }
    public float? Similarity { get; private set; }
    public string? NotificationId { get; private set; }
    public string? MetadataJson { get; private set; }

    public static FaceIdVerifyRequest Create(
        Guid requestGroupId,
        Guid targetUserId,
        Guid? initiatorUserId,
        Guid? sessionId,
        Guid? classSectionId,
        float threshold,
        DateTime expiresAt)
    {
        return new FaceIdVerifyRequest(Guid.NewGuid(), requestGroupId, targetUserId, initiatorUserId, sessionId,
            classSectionId,
            threshold, expiresAt);
    }

    public void MarkCompleted(bool matched, float similarity)
    {
        Status = FaceIdVerifyRequestStatus.Completed;
        Matched = matched;
        Similarity = similarity;
        CompletedAt = DateTime.UtcNow;
    }

    public void MarkExpired()
    {
        Status = FaceIdVerifyRequestStatus.Expired;
        CompletedAt = DateTime.UtcNow;
    }

    public void Cancel()
    {
        Status = FaceIdVerifyRequestStatus.Canceled;
        CompletedAt = DateTime.UtcNow;
    }

    // ✅ Thêm: Method để cập nhật NotificationId
    public void UpdateNotificationId(string notificationId)
    {
        NotificationId = notificationId;
    }
}

public enum FaceIdVerifyRequestStatus
{
    Pending = 0,
    Completed = 1,
    Expired = 2,
    Canceled = 3
}