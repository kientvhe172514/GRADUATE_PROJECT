using Zentry.SharedKernel.Domain;

namespace Zentry.SharedKernel.Constants.Attendance;

public class RoundStatus : Enumeration
{
    public static readonly RoundStatus Pending = new(1, nameof(Pending));
    public static readonly RoundStatus Active = new(2, nameof(Active));
    public static readonly RoundStatus Completed = new(3, nameof(Completed));
    public static readonly RoundStatus Finalized = new(4, nameof(Finalized));
    public static readonly RoundStatus Cancelled = new(5, nameof(Cancelled));

    private RoundStatus(int id, string name) : base(id, name)
    {
    }

    public static RoundStatus FromName(string name)
    {
        return FromName<RoundStatus>(name);
    }

    public static RoundStatus FromId(int id)
    {
        return FromId<RoundStatus>(id);
    }
}