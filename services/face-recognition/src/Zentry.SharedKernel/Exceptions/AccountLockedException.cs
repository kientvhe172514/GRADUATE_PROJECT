namespace Zentry.SharedKernel.Exceptions;

/// <summary>
///     Represents an exception thrown when an account is locked.
/// </summary>
public class AccountLockedException : BusinessLogicException
{
    public AccountLockedException(Guid id) : base($"Account with ID {id} is locked.")
    {
    }

    public AccountLockedException(string message) : base(message)
    {
    }

    public AccountLockedException(string message, Exception innerException) : base(message, innerException)
    {
    }
}