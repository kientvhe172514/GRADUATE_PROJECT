using Zentry.SharedKernel.Domain;

namespace Zentry.SharedKernel.Constants.Schedule;

public class WeekDayEnum : Enumeration
{
    public static readonly WeekDayEnum Monday = new(1, nameof(Monday));
    public static readonly WeekDayEnum Tuesday = new(2, nameof(Tuesday));
    public static readonly WeekDayEnum Wednesday = new(3, nameof(Wednesday));
    public static readonly WeekDayEnum Thursday = new(4, nameof(Thursday));
    public static readonly WeekDayEnum Friday = new(5, nameof(Friday));
    public static readonly WeekDayEnum Saturday = new(6, nameof(Saturday));
    public static readonly WeekDayEnum Sunday = new(7, nameof(Sunday));

    private WeekDayEnum(int id, string name) : base(id, name)
    {
    }

    public static WeekDayEnum FromName(string name)
    {
        return FromName<WeekDayEnum>(name);
    }

    public static WeekDayEnum FromId(int id)
    {
        return FromId<WeekDayEnum>(id);
    }
}