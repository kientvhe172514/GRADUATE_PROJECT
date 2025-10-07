using Zentry.SharedKernel.Common;
using Zentry.SharedKernel.Domain;

namespace Zentry.Modules.DeviceManagement.ValueObjects;

public class DeviceName : ValueObject
{
    private DeviceName(string value)
    {
        Value = value;
    }

    public string Value { get; }

    public static DeviceName Create(string value)
    {
        Guard.AgainstNullOrEmpty(value, nameof(value));
        if (value.Length > 255) throw new ArgumentException("Device name cannot exceed 255 characters.", nameof(value));
        return new DeviceName(value);
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}