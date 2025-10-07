using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Zentry.Modules.ConfigurationManagement.Persistence;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Configuration;

namespace Zentry.Modules.ConfigurationManagement.Integration;

public class GetUserAttributesIntegrationQueryHandler(
    ConfigurationDbContext dbContext,
    ILogger<GetUserAttributesIntegrationQueryHandler> logger)
    : IQueryHandler<GetUserAttributesIntegrationQuery, GetUserAttributesIntegrationResponse>
{
    public async Task<GetUserAttributesIntegrationResponse> Handle(
        GetUserAttributesIntegrationQuery query,
        CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Fetching user attributes for UserId: {UserId}", query.UserId);

            var userAttributes = await dbContext.UserAttributes
                .AsNoTracking()
                .Include(ua => ua.AttributeDefinition)
                .Where(ua => ua.UserId == query.UserId)
                .Select(ua => new
                {
                    ua.AttributeDefinition!.Key,
                    Value = ua.AttributeValue
                })
                .ToDictionaryAsync(
                    key => key.Key,
                    value => value.Value,
                    cancellationToken
                );

            if (userAttributes.Count == 0)
                logger.LogWarning("No user attributes found for UserId: {UserId}", query.UserId);

            return new GetUserAttributesIntegrationResponse(userAttributes);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to fetch user attributes for UserId: {UserId}", query.UserId);
            return new GetUserAttributesIntegrationResponse(new Dictionary<string, string>());
        }
    }
}