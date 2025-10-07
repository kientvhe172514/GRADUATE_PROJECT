using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Zentry.Modules.ConfigurationManagement.Abstractions;
using Zentry.Modules.ConfigurationManagement.Persistence;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Response;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ConfigurationManagement.Features.UpdateSetting;

public class UpdateSettingCommandHandler(
    IAttributeService attributeService,
    ConfigurationDbContext dbContext,
    ILogger<UpdateSettingCommandHandler> logger)
    : ICommandHandler<UpdateSettingCommand, UpdateSettingResponse>
{
    public async Task<UpdateSettingResponse> Handle(UpdateSettingCommand command,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var request = command.SettingDetails;

            // Lấy Setting hiện tại kèm theo AttributeDefinition
            var setting = await dbContext.Settings
                .Include(s => s.AttributeDefinition)
                .FirstOrDefaultAsync(s => s.Id == request.SettingId, cancellationToken);

            if (setting is null)
            {
                logger.LogWarning("Setting with ID '{SettingId}' not found.", request.SettingId);
                throw new SettingNotFoundException(request.SettingId.ToString());
            }

            if (!await attributeService.IsValueValidForAttribute(setting.AttributeDefinition.Id, request.Value))
            {
                logger.LogWarning("Provided value '{Value}' is not valid for Attribute '{Key}' (DataType: {DataType}).",
                    request.Value, setting.AttributeDefinition.Key, setting.AttributeDefinition.DataType);
                throw new InvalidSettingValueException(ErrorMessages.Settings.InvalidSettingValue);
            }

            // Cập nhật giá trị
            setting.UpdateValue(request.Value);

            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            logger.LogInformation("Setting {SettingId} updated successfully with new value '{Value}'.",
                setting.Id, request.Value);

            return new UpdateSettingResponse
            {
                SettingId = setting.Id,
                AttributeId = setting.AttributeDefinition.Id,
                AttributeKey = setting.AttributeDefinition.Key,
                AttributeDisplayName = setting.AttributeDefinition.DisplayName,
                DataType = setting.AttributeDefinition.DataType.ToString(),
                Unit = setting.AttributeDefinition.Unit,
                SettingScopeType = setting.ScopeType.ToString(),
                ScopeId = setting.ScopeId,
                Value = setting.Value,
                CreatedAt = setting.CreatedAt,
                UpdatedAt = setting.UpdatedAt
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
            logger.LogError(ex, "An unexpected error occurred while updating Setting with ID '{SettingId}'.",
                command.SettingDetails?.SettingId);
            throw;
        }
    }
}