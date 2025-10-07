namespace Zentry.SharedKernel.Exceptions;

/// <summary>
///     Represents an exception thrown when a business rule is violated.
/// </summary>
public class BusinessRuleException : BusinessLogicException
{
    public BusinessRuleException(string code, string message) : base(message, code)
    {
    }

    public BusinessRuleException(string code, string message, Exception innerException) : base(code, innerException,
        message)
    {
    }
}