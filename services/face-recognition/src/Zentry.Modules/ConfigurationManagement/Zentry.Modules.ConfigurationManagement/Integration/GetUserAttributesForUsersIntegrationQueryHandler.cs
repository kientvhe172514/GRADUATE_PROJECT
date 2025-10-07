using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Zentry.Modules.ConfigurationManagement.Persistence;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Configuration;

namespace Zentry.Modules.ConfigurationManagement.Integration;

public class GetUserAttributesForUsersIntegrationQueryHandler(
    ConfigurationDbContext dbContext,
    ILogger<GetUserAttributesForUsersIntegrationQueryHandler> logger)
    : IQueryHandler<GetUserAttributesForUsersIntegrationQuery, GetUserAttributesForUsersIntegrationResponse>
{
    public async Task<GetUserAttributesForUsersIntegrationResponse> Handle(
        GetUserAttributesForUsersIntegrationQuery query,
        CancellationToken cancellationToken)
    {
        if (query.UserIds.Count == 0)
            return new GetUserAttributesForUsersIntegrationResponse(new Dictionary<Guid, Dictionary<string, string>>());

        try
        {
            logger.LogInformation("Fetching attributes for {Count} users.", query.UserIds.Count);

            var userAttributes = await dbContext.UserAttributes
                .AsNoTracking()
                .Include(ua => ua.AttributeDefinition)
                .Where(ua => query.UserIds.Contains(ua.UserId))
                .Select(ua => new
                {
                    ua.UserId,
                    ua.AttributeDefinition!.Key,
                    Value = ua.AttributeValue
                })
                .ToListAsync(cancellationToken);

            var userAttributesGrouped = userAttributes
                .GroupBy(ua => ua.UserId)
                .ToDictionary(
                    g => g.Key,
                    g => g.ToDictionary(a => a.Key, a => a.Value)
                );

            return new GetUserAttributesForUsersIntegrationResponse(userAttributesGrouped);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to fetch user attributes for multiple users.");
            return new GetUserAttributesForUsersIntegrationResponse(new Dictionary<Guid, Dictionary<string, string>>());
        }
    }
}