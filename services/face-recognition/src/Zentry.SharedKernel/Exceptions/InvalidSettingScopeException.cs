namespace Zentry.SharedKernel.Exceptions;

public class InvalidSettingScopeException(string key, string scopeType)
    : BusinessLogicException($"Attribute Definition '{key}' cannot be configured for scope type '{scopeType}'.");