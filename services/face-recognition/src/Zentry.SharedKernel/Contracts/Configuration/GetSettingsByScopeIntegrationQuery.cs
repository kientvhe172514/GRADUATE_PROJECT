using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Configuration;

public record GetSettingsByScopeIntegrationQuery(
    string ScopeType
) : IQuery<GetSettingsByScopeIntegrationResponse>;

public class GetSettingsByScopeIntegrationResponse
{
    public List<SettingContract> Items { get; set; } = [];

    public int TotalCount { get; set; }
}