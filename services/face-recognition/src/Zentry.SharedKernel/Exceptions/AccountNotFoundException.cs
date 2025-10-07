namespace Zentry.SharedKernel.Exceptions;

/// <summary>
///     Represents an exception thrown when an account is not found.
/// </summary>
public class AccountNotFoundException : BusinessLogicException
{
    public AccountNotFoundException(Guid accountId) : base($"Account with ID '{accountId}' not found.")
    {
    }

    public AccountNotFoundException(string message) : base(message)
    {
    }

    public AccountNotFoundException(string message, Exception innerException) : base(message, innerException)
    {
    }
}