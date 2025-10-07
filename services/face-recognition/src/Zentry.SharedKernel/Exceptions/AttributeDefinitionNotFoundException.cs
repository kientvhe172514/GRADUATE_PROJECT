namespace Zentry.SharedKernel.Exceptions;

public class AttributeDefinitionNotFoundException : BusinessLogicException
{
    public AttributeDefinitionNotFoundException(string key)
        : base($"Attribute Definition with Key '{key}' not found.", "ATTRIBUTE_DEF_NOT_FOUND")
    {
    }
}