using Microsoft.EntityFrameworkCore;
using Zentry.Modules.ConfigurationManagement.Dtos;
using Zentry.Modules.ConfigurationManagement.Entities;
using Zentry.Modules.ConfigurationManagement.Persistence;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Configuration;
using Zentry.SharedKernel.Constants.Response;
using Zentry.SharedKernel.Exceptions;

// Đảm bảo namespace này đúng

// Thêm namespace này

namespace Zentry.Modules.ConfigurationManagement.Features.GetSettings;

public class
    GetSettingsQueryHandler(
        ConfigurationDbContext dbContext)
    : IQueryHandler<GetSettingsQuery, GetSettingsResponse>
{
    public async Task<GetSettingsResponse> Handle(GetSettingsQuery query,
        CancellationToken cancellationToken)
    {
        IQueryable<Setting> settingsQuery = dbContext.Settings
            .Include(c => c.AttributeDefinition);

        if (query.AttributeId.HasValue)
            settingsQuery = settingsQuery.Where(c => c.AttributeId == query.AttributeId.Value);

        ScopeType? requestedScopeType = null;
        Guid? parsedScopeId = null;

        if (!string.IsNullOrWhiteSpace(query.ScopeType))
            try
            {
                requestedScopeType = ScopeType.FromName(query.ScopeType);
                settingsQuery = settingsQuery.Where(c => c.ScopeType == requestedScopeType);
            }
            catch (InvalidOperationException ex)
            {
                throw new InvalidSettingScopeException(ErrorMessages.Settings.InvalidSettingScope, query.ScopeType);
            }

        if (!string.IsNullOrWhiteSpace(query.ScopeId))
        {
            if (Guid.TryParse(query.ScopeId, out var tempGuid))
                parsedScopeId = tempGuid;
            else
                throw new ArgumentException("ScopeId không phải là định dạng GUID hợp lệ.");
        }
        else
        {
            parsedScopeId = Guid.Empty;
        }

        if (Equals(requestedScopeType, ScopeType.Global))
            settingsQuery = settingsQuery.Where(c => c.ScopeId == Guid.Empty);
        else if (requestedScopeType != null)
            settingsQuery = settingsQuery.Where(c => c.ScopeId == parsedScopeId.Value && c.ScopeId != Guid.Empty);

        if (!string.IsNullOrWhiteSpace(query.SearchTerm))
        {
            var lowerSearchTerm = query.SearchTerm.ToLower();
            settingsQuery = settingsQuery.Where(c =>
                c.AttributeDefinition.Key.ToLower().Contains(lowerSearchTerm) ||
                c.AttributeDefinition.DisplayName.ToLower()
                    .Contains(lowerSearchTerm) ||
                c.Value.ToLower().Contains(lowerSearchTerm));
        }

        var totalCount = await settingsQuery.CountAsync(cancellationToken);

        var settings = await settingsQuery
            .OrderBy(c => c.CreatedAt) // Có thể thêm OrderBy động như GetListAttributeDefinitionQueryHandler
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(cancellationToken);

        var configDtos = settings.Select(c => new SettingDto
        {
            Id = c.Id,
            AttributeId = c.AttributeId,
            AttributeKey = c.AttributeDefinition?.Key ?? "N/A",
            AttributeDisplayName = c.AttributeDefinition?.DisplayName ?? "N/A",
            DataType = c.AttributeDefinition?.DataType != null ? c.AttributeDefinition.DataType.ToString() : "N/A",
            ScopeType = c.ScopeType.ToString(),
            ScopeId = c.ScopeId,
            Value = c.Value,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt
        }).ToList();

        var response = new GetSettingsResponse
        {
            Items = configDtos,
            TotalCount = totalCount,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize
        };

        return response;
    }
}