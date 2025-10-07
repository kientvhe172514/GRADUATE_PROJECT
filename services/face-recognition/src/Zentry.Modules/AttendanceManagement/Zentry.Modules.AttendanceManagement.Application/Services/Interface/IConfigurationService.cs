using Zentry.SharedKernel.Contracts.Configuration;

namespace Zentry.Modules.AttendanceManagement.Application.Services.Interface;

public interface IConfigurationService
{
    Task<Dictionary<string, SettingContract>> GetAllSettingsForScopeAsync(
        string scopeType,
        Guid? scopeId = null,
        CancellationToken cancellationToken = default);

    Task<GetMultipleSettingsIntegrationResponse> GetMultipleSettingsInBatchAsync(
        List<ScopeQueryRequest> requests,
        CancellationToken cancellationToken = default);
}