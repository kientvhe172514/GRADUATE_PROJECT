using Zentry.SharedKernel.Domain;

namespace Zentry.SharedKernel.Constants.Notification;

public class NotificationPriority : Enumeration
{
    public static readonly NotificationPriority High = new(1, nameof(High));
    public static readonly NotificationPriority Normal = new(2, nameof(Normal));
    public static readonly NotificationPriority Low = new(3, nameof(Low));

    private NotificationPriority(int id, string name) : base(id, name)
    {
    }

    public static NotificationPriority FromName(string name)
    {
        return FromName<NotificationPriority>(name);
    }

    public static NotificationPriority FromId(int id)
    {
        return FromId<NotificationPriority>(id);
    }
}