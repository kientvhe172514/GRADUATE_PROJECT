namespace Zentry.SharedKernel.Exceptions;

/// <summary>
///     Represents an exception thrown when a class section is not found.
/// </summary>
public class ClassSectionNotFoundException : BusinessLogicException
{
    public ClassSectionNotFoundException(Guid classSectionId) : base(
        $"Class section with ID '{classSectionId}' not found.")
    {
    }

    public ClassSectionNotFoundException(string message) : base(message)
    {
    }

    public ClassSectionNotFoundException(string message, Exception innerException) : base(message, innerException)
    {
    }
}