namespace Zentry.SharedKernel.Exceptions;

public class SettingAlreadyExistsException(string attributeKey, string scopeType, Guid scopeId)
    : BusinessLogicException(
        $"Setting for Attribute '{attributeKey}' with Scope '{scopeType}' and ScopeId '{scopeId}' already exists.");