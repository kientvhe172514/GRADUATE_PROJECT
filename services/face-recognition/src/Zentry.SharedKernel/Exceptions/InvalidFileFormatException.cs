namespace Zentry.SharedKernel.Exceptions;

public class InvalidFileFormatException : BusinessLogicException
{
    public InvalidFileFormatException() : base("Invalid file format.")
    {
    }

    public InvalidFileFormatException(string message) : base(message)
    {
    }

    public InvalidFileFormatException(string message, Exception innerException) : base(message, innerException)
    {
    }
}