using Zentry.Modules.ConfigurationManagement.Dtos;

namespace Zentry.Modules.ConfigurationManagement.Features.UpdateAttributeDefinition;

public class UpdateAttributeDefinitionRequest
{
    public Guid? AttributeId { get; set; }
    public string? DisplayName { get; set; }
    public string? Description { get; set; }
    public string? DataType { get; set; }
    public List<string>? AllowedScopeTypes { get; set; }
    public string? Unit { get; set; }
    public string? DefaultValue { get; set; }
    public bool? IsDeletable { get; set; }
    public List<OptionUpdateDto>? Options { get; set; }
}