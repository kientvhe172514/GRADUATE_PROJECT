using MediatR;
using Microsoft.Extensions.Logging;
using Zentry.Modules.AttendanceManagement.Application.Services.Interface;
using Zentry.SharedKernel.Contracts.Configuration;

namespace Zentry.Modules.AttendanceManagement.Application.Services;

public static class AttendanceScopeTypes
{
    public const string Global = "GLOBAL";
    public const string Course = "COURSE";
    public const string Session = "SESSION";
}

public class ConfigurationService(
    IMediator mediator,
    ILogger<ConfigurationService> logger)
    : IConfigurationService
{
    public async Task<GetMultipleSettingsIntegrationResponse> GetMultipleSettingsInBatchAsync(
        List<ScopeQueryRequest> requests,
        CancellationToken cancellationToken = default)
    {
        var query = new GetMultipleSettingsIntegrationQuery(requests);
        return await mediator.Send(query, cancellationToken);
    }

    public async Task<Dictionary<string, SettingContract>> GetAllSettingsForScopeAsync(
        string scopeType,
        Guid? scopeId = null,
        CancellationToken cancellationToken = default)
    {
        logger.LogDebug(
            "Local cache miss for all settings in scope '{ScopeType}' (ID: {ScopeId}). Fetching from Setting Module.",
            scopeType, scopeId);
        var request = new GetSettingsByScopeIntegrationQuery(scopeType);

        try
        {
            var response = await mediator.Send(request, cancellationToken);
            var filteredItems = response.Items.AsEnumerable();
            if (scopeId.HasValue && scopeId.Value != Guid.Empty &&
                !scopeType.Equals(AttendanceScopeTypes.Global, StringComparison.OrdinalIgnoreCase))
                filteredItems = filteredItems.Where(s => s.ScopeId == scopeId.Value);

            var settingsDictionary = filteredItems.ToDictionary(
                s => s.AttributeKey,
                s => s,
                StringComparer.OrdinalIgnoreCase
            );

            if (settingsDictionary.Count == 0 ||
                (!scopeType.Equals(AttendanceScopeTypes.Global, StringComparison.OrdinalIgnoreCase) &&
                 !scopeType.Equals(AttendanceScopeTypes.Course, StringComparison.OrdinalIgnoreCase) &&
                 !scopeType.Equals(AttendanceScopeTypes.Session, StringComparison.OrdinalIgnoreCase)))
                return settingsDictionary;
            logger.LogInformation("Cached all settings for scope '{ScopeType}' (ID: {ScopeId}) locally.", scopeType,
                scopeId);

            return settingsDictionary;
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Failed to retrieve all settings for scope '{ScopeType}' (ID: {ScopeId}) from Setting Module.",
                scopeType, scopeId);
            return new Dictionary<string, SettingContract>();
        }
    }
}