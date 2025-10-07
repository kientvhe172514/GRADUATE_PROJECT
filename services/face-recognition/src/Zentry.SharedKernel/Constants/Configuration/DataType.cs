using Zentry.SharedKernel.Domain;

namespace Zentry.SharedKernel.Constants.Configuration;

public class DataType : Enumeration
{
    public static readonly DataType String = new(1, nameof(String));
    public static readonly DataType Int = new(2, nameof(Int));
    public static readonly DataType Boolean = new(3, nameof(Boolean));
    public static readonly DataType Decimal = new(4, nameof(Decimal));
    public static readonly DataType Date = new(5, nameof(Date));
    public static readonly DataType Json = new(6, nameof(Json));
    public static readonly DataType Selection = new(7, nameof(Selection));

    private DataType(int id, string name) : base(id, name)
    {
    }

    public static DataType FromName(string name)
    {
        return FromName<DataType>(name);
    }

    public static DataType FromId(int id)
    {
        return FromId<DataType>(id);
    }
}