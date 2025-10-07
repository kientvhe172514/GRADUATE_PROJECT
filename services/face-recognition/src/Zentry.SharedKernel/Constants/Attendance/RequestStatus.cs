using Zentry.SharedKernel.Domain;

namespace Zentry.SharedKernel.Constants.Attendance;

public class RequestStatus : Enumeration
{
    public static readonly RequestStatus Pending = new(1, nameof(Pending));
    public static readonly RequestStatus Approved = new(2, nameof(Approved));
    public static readonly RequestStatus Rejected = new(3, nameof(Rejected));

    private RequestStatus(int id, string name) : base(id, name)
    {
    }

    public static RequestStatus FromName(string name)
    {
        return FromName<RequestStatus>(name);
    }

    public static RequestStatus FromId(int id)
    {
        return FromId<RequestStatus>(id);
    }
}