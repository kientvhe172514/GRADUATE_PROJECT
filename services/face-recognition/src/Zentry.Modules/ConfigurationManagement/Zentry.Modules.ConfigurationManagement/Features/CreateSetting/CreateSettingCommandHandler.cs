using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Zentry.Modules.ConfigurationManagement.Abstractions;
using Zentry.Modules.ConfigurationManagement.Entities;
using Zentry.Modules.ConfigurationManagement.Persistence;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Configuration;
using Zentry.SharedKernel.Constants.Response;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ConfigurationManagement.Features.CreateSetting;

public class CreateSettingCommandHandler(
    IAttributeService attributeService,
    ConfigurationDbContext dbContext,
    ILogger<CreateSettingCommandHandler> logger)
    : ICommandHandler<CreateSettingCommand, CreateSettingResponse>
{
    public async Task<CreateSettingResponse> Handle(CreateSettingCommand command,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var settingRequest = command.SettingDetails;

            var attributeDefinition = await dbContext.AttributeDefinitions
                .FirstOrDefaultAsync(ad => ad.Key == settingRequest.AttributeKey, cancellationToken);

            if (attributeDefinition is null)
            {
                logger.LogWarning("Attribute Definition with Key '{Key}' not found.", settingRequest.AttributeKey);
                throw new AttributeDefinitionNotFoundException(settingRequest.AttributeKey);
            }

            ScopeType settingScopeType;
            try
            {
                settingScopeType = ScopeType.FromName(settingRequest.ScopeType);
            }
            catch (InvalidOperationException ex)
            {
                logger.LogWarning(ex, "Invalid ScopeType provided for Setting: {Message}", ex.Message);
                throw new InvalidSettingScopeException(ErrorMessages.Settings.InvalidSettingScope,
                    command.SettingDetails.ScopeType);
            }

            if (!attributeDefinition.AllowedScopeTypes.Contains(settingScopeType))
            {
                logger.LogWarning(
                    "Attribute Definition '{Key}' does not allow settings for ScopeType '{ScopeType}'. Allowed: {AllowedScopes}",
                    attributeDefinition.Key, settingScopeType.ToString(),
                    string.Join(", ", attributeDefinition.AllowedScopeTypes.Select(s => s.ToString())));
                throw new InvalidSettingScopeException(attributeDefinition.Key, settingScopeType.ToString());
            }

            if (!await attributeService.IsValueValidForAttribute(attributeDefinition.Id, settingRequest.Value))
            {
                logger.LogWarning("Provided value '{Value}' is not valid for Attribute '{Key}' (DataType: {DataType}).",
                    settingRequest.Value, attributeDefinition.Key, attributeDefinition.DataType);
                throw new InvalidSettingValueException(ErrorMessages.Settings.InvalidSettingValue);
            }

            Guid finalScopeId;
            if (Equals(settingScopeType, ScopeType.Global))
            {
                finalScopeId = Guid.Empty;
            }
            else
            {
                if (!Guid.TryParse(settingRequest.ScopeId, out finalScopeId))
                {
                    logger.LogError("Validator failed to catch invalid GUID for non-Global ScopeId: {ScopeId}",
                        settingRequest.ScopeId);
                    throw new ArgumentException("ScopeId không phải là định dạng GUID hợp lệ.");
                }
            }

            var existingSetting = await dbContext.Settings
                .FirstOrDefaultAsync(c => c.AttributeId == attributeDefinition.Id &&
                                          c.ScopeType == settingScopeType &&
                                          c.ScopeId == finalScopeId,
                    cancellationToken);

            if (existingSetting is not null)
            {
                logger.LogWarning(
                    "Setting for Attribute '{Key}' with Scope '{ScopeType}' and ScopeId '{ScopeId}' already exists.",
                    attributeDefinition.Key, settingScopeType, finalScopeId);
                throw new SettingAlreadyExistsException(attributeDefinition.Key, settingScopeType.ToString(),
                    finalScopeId);
            }

            var newSetting = Setting.Create(
                attributeDefinition.Id,
                settingScopeType,
                finalScopeId,
                settingRequest.Value
            );

            await dbContext.Settings.AddAsync(newSetting, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            logger.LogInformation(
                "Setting {SettingId} created successfully for Attribute '{AttributeKey}' with Scope '{ScopeType}' and ScopeId '{ScopeId}'.",
                newSetting.Id, attributeDefinition.Key, newSetting.ScopeType, newSetting.ScopeId);

            return new CreateSettingResponse
            {
                SettingId = newSetting.Id,
                AttributeId = attributeDefinition.Id,
                AttributeKey = attributeDefinition.Key,
                AttributeDisplayName = attributeDefinition.DisplayName,
                DataType = attributeDefinition.DataType.ToString(),
                Unit = attributeDefinition.Unit,
                SettingScopeType = newSetting.ScopeType.ToString(),
                ScopeId = newSetting.ScopeId,
                Value = newSetting.Value,
                CreatedAt = newSetting.CreatedAt,
                UpdatedAt = newSetting.UpdatedAt
            };
        }
        catch (BusinessLogicException)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            logger.LogError(ex,
                "An unexpected error occurred while creating setting for attribute key '{AttributeKey}' and scope '{ScopeType}' '{ScopeId}'.",
                command.SettingDetails?.AttributeKey, command.SettingDetails?.ScopeType,
                command.SettingDetails?.ScopeId);
            throw;
        }
    }
}