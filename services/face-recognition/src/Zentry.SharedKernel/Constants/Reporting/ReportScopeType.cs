using Zentry.SharedKernel.Domain;

namespace Zentry.SharedKernel.Constants.Reporting;

public class ReportScopeType : Enumeration
{
    public static readonly ReportScopeType Student = new(1, nameof(Student));
    public static readonly ReportScopeType Session = new(2, nameof(Session));
    public static readonly ReportScopeType Schedule = new(3, nameof(Schedule));
    public static readonly ReportScopeType Course = new(4, nameof(Course));
    public static readonly ReportScopeType Lecturer = new(5, nameof(Lecturer));
    public static readonly ReportScopeType Room = new(6, nameof(Room));

    private ReportScopeType(int id, string name) : base(id, name)
    {
    }

    public static ReportScopeType FromName(string name)
    {
        return FromName<ReportScopeType>(name);
    }

    public static ReportScopeType FromId(int id)
    {
        return FromId<ReportScopeType>(id);
    }
}