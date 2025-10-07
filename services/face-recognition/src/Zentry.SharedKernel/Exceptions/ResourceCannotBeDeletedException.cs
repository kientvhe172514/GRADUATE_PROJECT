namespace Zentry.SharedKernel.Exceptions;

public class ResourceCannotBeDeletedException : BusinessLogicException
{
    public ResourceCannotBeDeletedException(string resourceName, Guid id) : base(
        $"{resourceName} with ID '{id}' can not be deleted.")
    {
    }

    public ResourceCannotBeDeletedException(string message) : base(message)
    {
    }

    public ResourceCannotBeDeletedException(string message, Exception innerException) : base(message, innerException)
    {
    }
}