using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Zentry.Modules.ConfigurationManagement.Persistence;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Configuration;
using Zentry.SharedKernel.Contracts.Configuration;

namespace Zentry.Modules.ConfigurationManagement.Integration;

public class GetHierarchicalSettingsIntegrationQueryHandler(
    ConfigurationDbContext dbContext,
    ILogger<GetHierarchicalSettingsIntegrationQueryHandler> logger)
    : IQueryHandler<GetHierarchicalSettingsIntegrationQuery, GetHierarchicalSettingsIntegrationResponse>
{
    // Define priority order (higher priority = lower value, will be chosen first)
    private static readonly Dictionary<string, int> ScopePriority = new()
    {
        [ScopeType.Global.ToString()] = 100,
        [ScopeType.Course.ToString()] = 75,
        [ScopeType.Session.ToString()] = 50,
        [ScopeType.User.ToString()] = 25
    };

    public async Task<GetHierarchicalSettingsIntegrationResponse> Handle(
        GetHierarchicalSettingsIntegrationQuery query,
        CancellationToken cancellationToken)
    {
        var result = new Dictionary<string, HierarchicalSettingResult>();

        if (query.AttributeKeys.Count == 0)
        {
            logger.LogWarning("GetHierarchicalSettingsIntegrationQuery received with no attribute keys");
            return new GetHierarchicalSettingsIntegrationResponse(result);
        }

        if (query.ScopeContexts.Count == 0)
        {
            logger.LogWarning("GetHierarchicalSettingsIntegrationQuery received with no scope contexts");
            return new GetHierarchicalSettingsIntegrationResponse(result);
        }

        var validScopeContexts = new List<(ScopeContext Context, ScopeType ScopeType)>();

        // Validate scope contexts
        foreach (var context in query.ScopeContexts)
            try
            {
                var parsedScopeType = ScopeType.FromName(context.ScopeType);
                validScopeContexts.Add((context, parsedScopeType));
            }
            catch (ArgumentException ex)
            {
                logger.LogWarning("Invalid ScopeType '{ScopeType}' in hierarchical query: {Message}",
                    context.ScopeType, ex.Message);
            }

        if (validScopeContexts.Count == 0)
        {
            logger.LogWarning("No valid scope contexts found after validation");
            return new GetHierarchicalSettingsIntegrationResponse(result);
        }

        try
        {
            // Get all settings for the requested keys across all scope contexts
            var attributeKeysLower = query.AttributeKeys.Select(k => k.ToLowerInvariant()).ToList();
            var scopeTypes = validScopeContexts.Select(vsc => vsc.ScopeType).Distinct().ToList();

            logger.LogInformation(
                "Fetching hierarchical settings for keys: [{Keys}] across scope contexts: [{ScopeContexts}]",
                string.Join(", ", query.AttributeKeys),
                string.Join(", ", validScopeContexts.Select(vsc => $"{vsc.Context.ScopeType}:{vsc.Context.ScopeId}")));

            var allMatchingSettings = await dbContext.Settings
                .Include(s => s.AttributeDefinition)
                .Where(s => scopeTypes.Contains(s.ScopeType) &&
                            s.AttributeDefinition != null &&
                            attributeKeysLower.Contains(s.AttributeDefinition.Key.ToLower()))
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            logger.LogDebug("Found {Count} total matching settings in database", allMatchingSettings.Count);

            // Process each attribute key
            foreach (var attributeKey in query.AttributeKeys)
            {
                var keyMatchingSettings = allMatchingSettings
                    .Where(s => s.AttributeDefinition != null &&
                                s.AttributeDefinition.Key.Equals(attributeKey, StringComparison.OrdinalIgnoreCase))
                    .ToList();

                var applicableSettings = new List<SettingContract>();

                // Find applicable settings for this key across all scope contexts
                foreach (var (context, scopeType) in validScopeContexts)
                {
                    var contextMatchingSettings = keyMatchingSettings
                        .Where(s => Equals(s.ScopeType, scopeType) &&
                                    (context.ScopeId == null || s.ScopeId == context.ScopeId))
                        .Select(s => new SettingContract
                        {
                            Id = s.Id,
                            AttributeId = s.AttributeId,
                            AttributeKey = s.AttributeDefinition?.Key ?? "N/A",
                            AttributeDisplayName = s.AttributeDefinition?.DisplayName ?? "N/A",
                            DataType = s.AttributeDefinition?.DataType.ToString() ?? "N/A",
                            ScopeType = s.ScopeType.ToString(),
                            ScopeId = s.ScopeId,
                            Value = s.Value,
                            CreatedAt = s.CreatedAt,
                            UpdatedAt = s.UpdatedAt
                        })
                        .ToList();

                    applicableSettings.AddRange(contextMatchingSettings);
                }

                // Determine effective setting based on priority
                SettingContract? effectiveSetting = null;

                if (applicableSettings.Count > 0)
                {
                    // Sort by priority (lower priority value = higher priority)
                    effectiveSetting = applicableSettings
                        .OrderBy(s => ScopePriority.GetValueOrDefault(s.ScopeType, int.MaxValue))
                        .ThenByDescending(s => s.UpdatedAt) // If same priority, use most recently updated
                        .First();

                    logger.LogDebug(
                        "Effective setting for key '{AttributeKey}': {ScopeType}:{ScopeId} = '{Value}' (chosen from {OptionsCount} options)",
                        attributeKey, effectiveSetting.ScopeType, effectiveSetting.ScopeId, effectiveSetting.Value,
                        applicableSettings.Count);
                }
                else
                {
                    logger.LogDebug("No applicable settings found for key '{AttributeKey}'", attributeKey);
                }

                result[attributeKey] = new HierarchicalSettingResult(
                    attributeKey,
                    effectiveSetting,
                    applicableSettings
                );
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error fetching hierarchical settings from database");
            throw;
        }

        var foundCount = result.Values.Count(r => r.EffectiveSetting != null);
        logger.LogInformation("Retrieved effective settings for {FoundCount} out of {TotalCount} requested keys",
            foundCount, result.Count);

        return new GetHierarchicalSettingsIntegrationResponse(result);
    }
}