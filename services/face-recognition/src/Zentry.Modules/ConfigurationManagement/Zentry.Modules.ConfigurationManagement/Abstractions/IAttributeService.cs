using Zentry.Modules.ConfigurationManagement.Entities;

namespace Zentry.Modules.ConfigurationManagement.Abstractions;

public interface IAttributeService
{
    Task<AttributeDefinition?> GetAttributeDefinitionByIdAsync(Guid id);

    Task<IEnumerable<Option>> GetOptionsByAttributeIdAsync(Guid attributeId);

    // Thêm các phương thức validate nếu cần, ví dụ:
    Task<bool> IsValueValidForAttribute(Guid attributeId, string value);
}