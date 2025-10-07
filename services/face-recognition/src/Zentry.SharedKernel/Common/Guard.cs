namespace Zentry.SharedKernel.Common;

public static class Guard
{
    public static void AgainstNull(object value, string parameterName)
    {
        if (value == null) throw new ArgumentNullException(parameterName);
    }

    public static void AgainstNullOrEmpty(string value, string parameterName)
    {
        if (string.IsNullOrEmpty(value))
            throw new ArgumentException($"{parameterName} cannot be null or empty.", parameterName);
    }

    public static void AgainstNegativeOrZero(int value, string parameterName)
    {
        if (value <= 0) throw new ArgumentException($"{parameterName} must be greater than zero.", parameterName);
    }
}