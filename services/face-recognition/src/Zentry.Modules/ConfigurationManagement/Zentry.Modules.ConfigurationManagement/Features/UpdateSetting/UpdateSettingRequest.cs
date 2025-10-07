namespace Zentry.Modules.ConfigurationManagement.Features.UpdateSetting;

public class UpdateSettingRequest
{
    public Guid? SettingId { get; set; }
    public string Value { get; set; } = string.Empty;
}