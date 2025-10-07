using Zentry.SharedKernel.Domain;

namespace Zentry.Modules.NotificationService.Enums;

public class NotificationType : Enumeration
{
    public static readonly NotificationType Email = new(1, nameof(Email));
    public static readonly NotificationType InApp = new(2, nameof(InApp));
    public static readonly NotificationType SMS = new(3, nameof(SMS));
    public static readonly NotificationType Push = new(4, nameof(Push));

    private NotificationType(int id, string name) : base(id, name)
    {
    }

    public static NotificationType FromName(string name)
    {
        return FromName<NotificationType>(name);
    }

    public static NotificationType FromId(int id)
    {
        return FromId<NotificationType>(id);
    }
}