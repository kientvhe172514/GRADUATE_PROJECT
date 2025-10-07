using Zentry.Modules.ConfigurationManagement.Dtos;

namespace Zentry.Modules.ConfigurationManagement.Features.CreateAttributeDefinition;

public class CreateAttributeDefinitionRequest
{
    public string Key { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string DataType { get; set; } = string.Empty;
    public List<string> AllowedScopeTypes { get; set; } = [];
    public string? Unit { get; set; }
    public string? DefaultValue { get; set; }
    public bool IsDeletable { get; set; } = true;
    public List<OptionCreationDto>? Options { get; set; }
}

public class OptionCreationDto
{
    public string Value { get; set; } = string.Empty;
    public string DisplayLabel { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

public class CreateAttributeDefinitionResponse
{
    public Guid AttributeId { get; set; }
    public string Key { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string DataType { get; set; }
    public List<string> AllowedScopeTypes { get; set; } = [];
    public string? Unit { get; set; }
    public string? DefaultValue { get; set; }
    public bool IsDeletable { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<OptionDto>? Options { get; set; }
}