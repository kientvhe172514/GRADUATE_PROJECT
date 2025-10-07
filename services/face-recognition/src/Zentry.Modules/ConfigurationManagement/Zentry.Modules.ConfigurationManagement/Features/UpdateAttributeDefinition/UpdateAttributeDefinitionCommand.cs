using Zentry.Modules.ConfigurationManagement.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ConfigurationManagement.Features.UpdateAttributeDefinition;

public class UpdateAttributeDefinitionCommand : ICommand<UpdateAttributeDefinitionResponse>
{
    public UpdateAttributeDefinitionRequest Details { get; set; } = new();
}

public class UpdateAttributeDefinitionResponse
{
    public Guid AttributeId { get; set; }
    public string Key { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public required string DataType { get; set; }
    public List<string> AllowedScopeTypes { get; set; } = new();
    public string? Unit { get; set; }
    public string? DefaultValue { get; set; }
    public bool IsDeletable { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<OptionDto>? Options { get; set; }
    public bool SettingsWereDeleted { get; set; }
}