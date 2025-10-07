using Zentry.SharedKernel.Domain;

namespace Zentry.SharedKernel.Constants.User;

public class Role : Enumeration
{
    public static readonly Role Admin = new(0, nameof(Admin));
    public static readonly Role Manager = new(1, nameof(Manager));
    public static readonly Role Lecturer = new(2, nameof(Lecturer));
    public static readonly Role Student = new(3, nameof(Student));

    private Role(int id, string name) : base(id, name)
    {
    }

    public static Role FromName(string name)
    {
        return FromName<Role>(name);
    }

    public static Role FromId(int id)
    {
        return FromId<Role>(id);
    }
}