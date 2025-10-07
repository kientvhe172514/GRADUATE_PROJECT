using Zentry.SharedKernel.Domain;

namespace Zentry.SharedKernel.Constants.Attendance;

public class FaceIdStatus : Enumeration
{
    public static readonly FaceIdStatus NotChecked = new(1, nameof(NotChecked));
    public static readonly FaceIdStatus Success = new(2, nameof(Success));
    public static readonly FaceIdStatus Failed = new(3, nameof(Failed));

    private FaceIdStatus(int id, string name) : base(id, name)
    {
    }

    public static FaceIdStatus FromName(string name)
    {
        return FromName<FaceIdStatus>(name);
    }

    public static FaceIdStatus FromId(int id)
    {
        return FromId<FaceIdStatus>(id);
    }
}