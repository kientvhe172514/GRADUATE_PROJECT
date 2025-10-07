namespace Zentry.Modules.ConfigurationManagement.Dtos;

public class GetSettingsRequest
{
    public Guid? AttributeId { get; init; }
    public string? ScopeType { get; init; }
    public string? ScopeId { get; init; }
    public string? SearchTerm { get; init; }
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
}