namespace Zentry.SharedKernel.Exceptions;

/// <summary>
///     Represents an exception thrown when an account is inactive.
/// </summary>
public class AccountInactiveException : BusinessLogicException
{
    public AccountInactiveException(Guid id) : base($"Account with ID {id} is inactive.")
    {
    }

    public AccountInactiveException(string message) : base(message)
    {
    }

    public AccountInactiveException(string message, Exception innerException) : base(message, innerException)
    {
    }
}