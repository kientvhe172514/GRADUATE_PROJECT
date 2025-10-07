namespace Zentry.SharedKernel.Exceptions;

public class DuplicateOptionLabelException : BusinessLogicException
{
    public DuplicateOptionLabelException(string message) : base(message)
    {
    }
}