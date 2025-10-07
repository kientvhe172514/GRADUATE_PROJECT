using Zentry.SharedKernel.Common;
using Zentry.SharedKernel.Domain;

namespace Zentry.Modules.DeviceManagement.ValueObjects;

public class AndroidId : ValueObject
{
    private AndroidId(string value)
    {
        Value = value;
    }

    public string Value { get; }

    public static AndroidId Create(string androidId)
    {
        Guard.AgainstNullOrEmpty(androidId, nameof(androidId));

        if (androidId.Length > 255) throw new ArgumentException("Android ID is too long.", nameof(androidId));

        return new AndroidId(androidId);
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }

    public override string ToString()
    {
        return Value;
    }

    public static implicit operator string(AndroidId androidId)
    {
        return androidId.Value;
    }
}