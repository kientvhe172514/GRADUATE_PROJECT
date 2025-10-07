namespace Zentry.SharedKernel.Exceptions;

/// <summary>
///     Represents an exception thrown when an account is disabled.
/// </summary>
public class AccountDisabledException : BusinessLogicException
{
    public AccountDisabledException() : base("Account is disabled.")
    {
    }

    public AccountDisabledException(string message) : base(message)
    {
    }

    public AccountDisabledException(string message, Exception innerException) : base(message, innerException)
    {
    }
}