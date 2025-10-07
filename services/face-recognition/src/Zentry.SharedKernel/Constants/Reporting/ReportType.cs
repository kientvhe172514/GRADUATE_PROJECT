using Zentry.SharedKernel.Domain;

namespace Zentry.SharedKernel.Constants.Reporting;

public class ReportType : Enumeration
{
    public static readonly ReportType Summary = new(1, nameof(Summary));
    public static readonly ReportType Detailed = new(2, nameof(Detailed));
    public static readonly ReportType Warning = new(3, nameof(Warning));

    private ReportType(int id, string name) : base(id, name)
    {
    }

    public static ReportType FromName(string name)
    {
        return FromName<ReportType>(name);
    }

    public static ReportType FromId(int id)
    {
        return FromId<ReportType>(id);
    }
}