using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Zentry.Modules.ConfigurationManagement.Entities;
using Zentry.Modules.ConfigurationManagement.Persistence;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Configuration;

namespace Zentry.Modules.ConfigurationManagement.Integration;

public class BulkCreateUserAttributesIntegrationCommandHandler(
    ConfigurationDbContext dbContext,
    ILogger<BulkCreateUserAttributesIntegrationCommandHandler> logger)
    : ICommandHandler<BulkCreateUserAttributesIntegrationCommand, BulkCreateUserAttributesIntegrationResponse>
{
    public async Task<BulkCreateUserAttributesIntegrationResponse> Handle(
        BulkCreateUserAttributesIntegrationCommand command,
        CancellationToken cancellationToken)
    {
        var skippedAttributesByUser = new Dictionary<Guid, List<string>>();
        var totalProcessed = command.UserAttributesMap.Count;
        var totalSuccessful = 0;
        var totalFailed = 0;

        try
        {
            logger.LogInformation("Bulk creating user attributes for {UserCount} users.", totalProcessed);

            // Lấy tất cả attribute keys cần thiết
            var allAttributeKeys = command.UserAttributesMap
                .SelectMany(kvp => kvp.Value.Keys)
                .Distinct()
                .ToList();

            // Lấy tất cả attribute definitions một lần
            var attributeDefinitions = await dbContext.AttributeDefinitions
                .Where(ad => allAttributeKeys.Contains(ad.Key))
                .ToDictionaryAsync(ad => ad.Key, ad => ad, cancellationToken);

            var allUserAttributes = new List<UserAttribute>();

            foreach (var userAttributesEntry in command.UserAttributesMap)
            {
                var userId = userAttributesEntry.Key;
                var userAttributes = userAttributesEntry.Value;
                var userSkippedAttributes = new List<string>();

                foreach (var attributeEntry in userAttributes)
                {
                    var attributeKey = attributeEntry.Key;
                    var attributeValue = attributeEntry.Value;

                    if (attributeDefinitions.TryGetValue(attributeKey, out var definition))
                    {
                        allUserAttributes.Add(
                            UserAttribute.Create(
                                userId,
                                definition.Id,
                                attributeValue
                            )
                        );
                    }
                    else
                    {
                        logger.LogWarning(
                            "Attribute with key '{AttributeKey}' not found in AttributeDefinitions for UserId: {UserId}.",
                            attributeKey, userId);
                        userSkippedAttributes.Add(attributeKey);
                    }
                }

                if (userSkippedAttributes.Count > 0)
                {
                    skippedAttributesByUser[userId] = userSkippedAttributes;
                }

                // Nếu user có ít nhất 1 attribute hợp lệ thì tính là successful
                if (userAttributes.Count > userSkippedAttributes.Count)
                {
                    totalSuccessful++;
                }
                else
                {
                    totalFailed++;
                }
            }

            // Bulk insert tất cả user attributes
            if (allUserAttributes.Count > 0)
            {
                await dbContext.UserAttributes.AddRangeAsync(allUserAttributes, cancellationToken);
                await dbContext.SaveChangesAsync(cancellationToken);

                logger.LogInformation(
                    "Successfully bulk created {AttributeCount} user attributes for {UserCount} users.",
                    allUserAttributes.Count, totalSuccessful);
            }

            return new BulkCreateUserAttributesIntegrationResponse(
                Success: true,
                Message: $"Bulk user attributes creation completed. {totalSuccessful} successful, {totalFailed} failed.",
                SkippedAttributesByUser: skippedAttributesByUser,
                TotalProcessed: totalProcessed,
                TotalSuccessful: totalSuccessful,
                TotalFailed: totalFailed
            );
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to bulk create user attributes - {Message}", ex.Message);
            return new BulkCreateUserAttributesIntegrationResponse(
                Success: false,
                Message: ex.Message,
                SkippedAttributesByUser: skippedAttributesByUser,
                TotalProcessed: totalProcessed,
                TotalSuccessful: 0,
                TotalFailed: totalProcessed
            );
        }
    }
}
