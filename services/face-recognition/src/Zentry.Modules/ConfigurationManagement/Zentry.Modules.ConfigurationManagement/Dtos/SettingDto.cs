namespace Zentry.Modules.ConfigurationManagement.Dtos;

public class SettingDto
{
    public Guid Id { get; set; }
    public Guid AttributeId { get; set; }
    public string AttributeKey { get; set; } = string.Empty;
    public string AttributeDisplayName { get; set; } = string.Empty;
    public string DataType { get; set; } = string.Empty;
    public string ScopeType { get; set; } = string.Empty;
    public Guid ScopeId { get; set; }
    public string Value { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}