namespace Zentry.Modules.ConfigurationManagement.Features.CreateSetting;

public class CreateSettingRequest
{
    public string AttributeKey { get; set; } = string.Empty;
    public string ScopeType { get; set; } = string.Empty;
    public string? ScopeId { get; set; }
    public string Value { get; set; } = string.Empty;
}