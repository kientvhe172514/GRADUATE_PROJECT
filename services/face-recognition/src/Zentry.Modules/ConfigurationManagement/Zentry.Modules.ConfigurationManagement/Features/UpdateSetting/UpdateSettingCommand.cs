using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ConfigurationManagement.Features.UpdateSetting;

public class UpdateSettingCommand : ICommand<UpdateSettingResponse>
{
    public UpdateSettingRequest SettingDetails { get; set; } = new();
}

public class UpdateSettingResponse
{
    public Guid SettingId { get; set; }
    public Guid AttributeId { get; set; }
    public string AttributeKey { get; set; } = string.Empty;
    public string AttributeDisplayName { get; set; } = string.Empty;
    public required string DataType { get; set; }
    public string? Unit { get; set; }
    public required string SettingScopeType { get; set; }
    public Guid ScopeId { get; set; }
    public string Value { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}