namespace Zentry.SharedKernel.Exceptions;

public class AttributeDefinitionKeyAlreadyExistsException(string key)
    : BusinessLogicException($"Attribute Definition with Key '{key}' already exists.");