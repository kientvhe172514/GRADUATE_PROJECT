using Zentry.SharedKernel.Domain;

namespace Zentry.SharedKernel.Constants.User;

public class AccountStatus : Enumeration
{
    public static readonly AccountStatus Active = new(1, nameof(Active));
    public static readonly AccountStatus Inactive = new(2, nameof(Inactive));
    public static readonly AccountStatus Locked = new(3, nameof(Locked));

    private AccountStatus(int id, string name) : base(id, name)
    {
    }

    public static AccountStatus FromName(string name)
    {
        return FromName<AccountStatus>(name);
    }

    public static AccountStatus FromId(int id)
    {
        return FromId<AccountStatus>(id);
    }
}