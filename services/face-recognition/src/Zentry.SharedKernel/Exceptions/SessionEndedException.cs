namespace Zentry.SharedKernel.Exceptions;

public class SessionEndedException(string message) : BusinessRuleException("SESSION_ENDED", message);