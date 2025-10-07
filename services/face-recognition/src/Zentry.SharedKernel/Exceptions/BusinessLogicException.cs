namespace Zentry.SharedKernel.Exceptions;

/// <summary>
///     Represents a base class for all business logic related exceptions.
/// </summary>
public abstract class BusinessLogicException : Exception
{
    protected BusinessLogicException(string message, string errorCode = "BUSINESS_ERROR") : base(message)
    {
        ErrorCode = errorCode;
    }

    protected BusinessLogicException(string message, Exception innerException, string errorCode = "BUSINESS_ERROR") :
        base(message, innerException)
    {
        ErrorCode = errorCode;
    }

    /// <summary>
    ///     Gets a unique error code for this exception type.
    /// </summary>
    public string ErrorCode { get; }
}