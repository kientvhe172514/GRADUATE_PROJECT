using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Zentry.Modules.ConfigurationManagement.Entities;
using Zentry.Modules.ConfigurationManagement.Persistence;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Configuration;

namespace Zentry.Modules.ConfigurationManagement.Integration;

public class CreateUserAttributesIntegrationCommandHandler(
    ConfigurationDbContext dbContext,
    ILogger<CreateUserAttributesIntegrationCommandHandler> logger)
    : ICommandHandler<CreateUserAttributesIntegrationCommand, CreateUserAttributesIntegrationResponse>
{
    public async Task<CreateUserAttributesIntegrationResponse> Handle(
        CreateUserAttributesIntegrationCommand command,
        CancellationToken cancellationToken)
    {
        var skippedAttributes = new List<string>();

        try
        {
            logger.LogInformation("Creating user attributes for UserId: {UserId} from provided data.",
                command.UserId);

            var attributeDefinitions = await dbContext.AttributeDefinitions
                .Where(ad => command.UserAttributes.Keys.Contains(ad.Key))
                .ToDictionaryAsync(ad => ad.Key, ad => ad, cancellationToken);

            var newUserAttributes = new List<UserAttribute>();

            foreach (var kvp in command.UserAttributes)
                if (attributeDefinitions.TryGetValue(kvp.Key, out var definition))
                {
                    newUserAttributes.Add(
                        UserAttribute.Create(
                            command.UserId,
                            definition.Id,
                            kvp.Value
                        )
                    );
                }
                else
                {
                    logger.LogWarning("Attribute with key '{AttributeKey}' not found in AttributeDefinitions.",
                        kvp.Key);
                    skippedAttributes.Add(kvp.Key);
                }

            if (newUserAttributes.Count > 0)
            {
                await dbContext.UserAttributes.AddRangeAsync(newUserAttributes, cancellationToken);
                await dbContext.SaveChangesAsync(cancellationToken);
            }

            logger.LogInformation("Successfully created {Count} user attributes for UserId: {UserId}",
                newUserAttributes.Count, command.UserId);

            return new CreateUserAttributesIntegrationResponse(true, "User attributes created successfully.",
                skippedAttributes);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to create user attributes for UserId: {UserId} - {Message}", command.UserId,
                ex.Message);
            return new CreateUserAttributesIntegrationResponse(false, ex.Message, skippedAttributes);
        }
    }
}