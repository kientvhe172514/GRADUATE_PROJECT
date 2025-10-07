using Microsoft.EntityFrameworkCore;
using Zentry.Modules.ConfigurationManagement.Persistence;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Configuration;
using Zentry.SharedKernel.Contracts.Configuration;

namespace Zentry.Modules.ConfigurationManagement.Integration;

public class GetSettingsByScopeQueryHandler(
    ConfigurationDbContext dbContext)
    : IQueryHandler<GetSettingsByScopeIntegrationQuery, GetSettingsByScopeIntegrationResponse>
{
    public async Task<GetSettingsByScopeIntegrationResponse> Handle(GetSettingsByScopeIntegrationQuery query,
        CancellationToken cancellationToken)
    {
        var requestedScopeType = ValidateAndParseScopeType(query.ScopeType);

        var response = await ExecuteQueryAsync(requestedScopeType, cancellationToken);

        return response;
    }

    private static ScopeType ValidateAndParseScopeType(string scopeTypeString)
    {
        if (string.IsNullOrWhiteSpace(scopeTypeString))
            throw new ArgumentException(
                "ScopeType cannot be null or empty for GetSettingsByScopeIntegrationQuery.");

        try
        {
            return ScopeType.FromName(scopeTypeString);
        }
        catch (ArgumentException ex)
        {
            throw new ArgumentException($"Invalid ScopeType provided for integration query: {ex.Message}");
        }
    }

    private async Task<GetSettingsByScopeIntegrationResponse> ExecuteQueryAsync(
        ScopeType requestedScopeType,
        CancellationToken cancellationToken)
    {
        var settingsQuery = dbContext.Settings
            .Include(c => c.AttributeDefinition)
            .Where(c => c.ScopeType == requestedScopeType)
            .AsNoTracking();

        var data = await settingsQuery
            .OrderBy(c => c.AttributeDefinition!.Key)
            .Select(c => new SettingContract
            {
                Id = c.Id,
                AttributeId = c.AttributeId,
                AttributeKey = c.AttributeDefinition != null ? c.AttributeDefinition.Key : "N/A",
                AttributeDisplayName = c.AttributeDefinition != null ? c.AttributeDefinition.DisplayName : "N/A",
                DataType = c.AttributeDefinition != null ? c.AttributeDefinition.DataType.ToString() : "N/A",
                ScopeType = c.ScopeType != null ? c.ScopeType.ToString() : "N/A",
                ScopeId = c.ScopeId,
                Value = c.Value,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return new GetSettingsByScopeIntegrationResponse
        {
            Items = data,
            TotalCount = data.Count
        };
    }
}