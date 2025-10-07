using Zentry.SharedKernel.Constants.Attendance;
using Zentry.SharedKernel.Domain;

namespace Zentry.Modules.UserManagement.Entities;

public class UserRequest : AggregateRoot<Guid>
{
    private UserRequest() : base(Guid.Empty)
    {
    }

    private UserRequest(Guid id, Guid requestedByUserId, Guid targetUserId, RequestType requestType,
        Guid relatedEntityId,
        string reason)
        : base(id)
    {
        RequestedByUserId = requestedByUserId;
        TargetUserId = targetUserId;
        RequestType = requestType;
        RelatedEntityId = relatedEntityId;
        Status = RequestStatus.Pending;
        Reason = reason;
        CreatedAt = DateTime.UtcNow;
    }

    public Guid RequestedByUserId { get; private set; }
    public Guid TargetUserId { get; private set; }
    public RequestType RequestType { get; private set; }
    public Guid RelatedEntityId { get; private set; }
    public RequestStatus Status { get; private set; }
    public string? Reason { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? ProcessedAt { get; private set; }

    public static UserRequest Create(Guid requestedByUserId, Guid targetUserId, RequestType requestType,
        Guid relatedEntityId, string reason)
    {
        return new UserRequest(Guid.NewGuid(), requestedByUserId, targetUserId, requestType, relatedEntityId, reason);
    }

    public void Approve()
    {
        Status = RequestStatus.Approved;
        ProcessedAt = DateTime.UtcNow;
    }

    public void Reject()
    {
        Status = RequestStatus.Rejected;
        ProcessedAt = DateTime.UtcNow;
    }
}