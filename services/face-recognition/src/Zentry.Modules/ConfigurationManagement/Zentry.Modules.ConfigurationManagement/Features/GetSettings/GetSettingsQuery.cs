using Zentry.Modules.ConfigurationManagement.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ConfigurationManagement.Features.GetSettings;

public record GetSettingsQuery : IQuery<GetSettingsResponse>
{
    public Guid? AttributeId { get; init; }
    public string? ScopeType { get; init; }
    public string? ScopeId { get; init; }
    public string? SearchTerm { get; init; }
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
}

public class GetSettingsResponse
{
    public List<SettingDto> Items { get; set; } = [];
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasNextPage => PageNumber < TotalPages;
    public bool HasPreviousPage => PageNumber > 1;
}