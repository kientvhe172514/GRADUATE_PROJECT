using Zentry.SharedKernel.Domain;

namespace Zentry.SharedKernel.Constants.Attendance;

public class RequestType : Enumeration
{
    public static readonly RequestType UpdateDevice = new(1, nameof(UpdateDevice));
    public static readonly RequestType ClaimAttendance = new(2, nameof(ClaimAttendance));

    private RequestType(int id, string name) : base(id, name)
    {
    }

    public static RequestType FromName(string name)
    {
        return FromName<RequestType>(name);
    }

    public static RequestType FromId(int id)
    {
        return FromId<RequestType>(id);
    }
}