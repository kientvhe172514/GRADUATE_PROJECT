using Zentry.SharedKernel.Domain;

namespace Zentry.SharedKernel.Constants.Attendance;

public class SessionStatus : Enumeration
{
    public static readonly SessionStatus Pending = new(1, nameof(Pending));
    public static readonly SessionStatus Active = new(2, nameof(Active));
    public static readonly SessionStatus Completed = new(3, nameof(Completed));
    public static readonly SessionStatus Cancelled = new(4, nameof(Cancelled));
    public static readonly SessionStatus Missed = new(5, nameof(Missed));

    private SessionStatus(int id, string name) : base(id, name)
    {
    }

    public static SessionStatus FromName(string name)
    {
        return FromName<SessionStatus>(name);
    }

    public static SessionStatus FromId(int id)
    {
        return FromId<SessionStatus>(id);
    }
}