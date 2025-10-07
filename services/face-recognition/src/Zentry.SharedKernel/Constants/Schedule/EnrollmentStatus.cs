using Zentry.SharedKernel.Domain;

namespace Zentry.SharedKernel.Constants.Schedule;

public class EnrollmentStatus : Enumeration
{
    // Định nghĩa các trạng thái
    public static readonly EnrollmentStatus Active = new(1, nameof(Active));
    public static readonly EnrollmentStatus Cancelled = new(2, nameof(Cancelled));
    public static readonly EnrollmentStatus Completed = new(3, nameof(Completed));

    private EnrollmentStatus(int id, string name) : base(id, name)
    {
    }

    public static EnrollmentStatus FromName(string name)
    {
        return FromName<EnrollmentStatus>(name);
    }

    public static EnrollmentStatus FromId(int id)
    {
        return FromId<EnrollmentStatus>(id);
    }
}