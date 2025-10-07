using Zentry.SharedKernel.Common;
using Zentry.SharedKernel.Domain;

namespace Zentry.Modules.DeviceManagement.ValueObjects;

public class DeviceToken : ValueObject
{
    private DeviceToken(string value)
    {
        Value = value;
    }

    public string Value { get; }

    // Tạo token mới (cho device mới)
    public static DeviceToken Create()
    {
        // Generate unique token (e.g., base64-encoded GUID)
        var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray()).Replace("/", "_").Replace("+", "-");
        Guard.AgainstNullOrEmpty(token, nameof(token));
        if (token.Length > 255)
            throw new ArgumentException("Device token cannot exceed 255 characters.", nameof(token));
        return new DeviceToken(token);
    }

    // Tạo từ giá trị existing (cho EF Core khi load từ DB)
    public static DeviceToken FromValue(string value)
    {
        Guard.AgainstNullOrEmpty(value, nameof(value));
        if (value.Length > 255)
            throw new ArgumentException("Device token cannot exceed 255 characters.", nameof(value));
        return new DeviceToken(value);
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }

    public static implicit operator string(DeviceToken deviceToken)
    {
        return deviceToken.Value;
    }
}