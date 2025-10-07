using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Configuration;

public record GetHierarchicalSettingsIntegrationQuery(
    List<string> AttributeKeys,
    List<ScopeContext> ScopeContexts
) : IQuery<GetHierarchicalSettingsIntegrationResponse>;

public record ScopeContext(
    string ScopeType,
    Guid? ScopeId = null
);

public record GetHierarchicalSettingsIntegrationResponse(
    Dictionary<string, HierarchicalSettingResult> SettingsByKey
);

public record HierarchicalSettingResult(
    string AttributeKey,
    SettingContract? EffectiveSetting,
    List<SettingContract> AllMatchingSettings
);