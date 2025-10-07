namespace Zentry.SharedKernel.Exceptions;

public class InvalidSettingValueException(string message) : BusinessLogicException(message);