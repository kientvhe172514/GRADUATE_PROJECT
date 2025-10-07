using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Zentry.Modules.ConfigurationManagement.Dtos;
using Zentry.Modules.ConfigurationManagement.Entities;
using Zentry.Modules.ConfigurationManagement.Persistence;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Configuration;
using Zentry.SharedKernel.Constants.Response;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ConfigurationManagement.Features.UpdateAttributeDefinition;

public class UpdateAttributeDefinitionCommandHandler(
    ConfigurationDbContext dbContext,
    ILogger<UpdateAttributeDefinitionCommandHandler> logger)
    : ICommandHandler<UpdateAttributeDefinitionCommand, UpdateAttributeDefinitionResponse>
{
    public async Task<UpdateAttributeDefinitionResponse> Handle(UpdateAttributeDefinitionCommand command,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var request = command.Details;
            var settingsWereDeleted = false;

            // Lấy AttributeDefinition hiện tại
            var attributeDefinition = await dbContext.AttributeDefinitions
                .Include(ad => ad.Options)
                .FirstOrDefaultAsync(ad => ad.Id == request.AttributeId, cancellationToken);

            if (attributeDefinition is null)
            {
                logger.LogWarning("Attribute Definition with ID '{AttributeId}' not found.", request.AttributeId);
                throw new AttributeDefinitionNotFoundException(request.AttributeId.ToString());
            }

            // Kiểm tra nếu AttributeDefinition không thể xóa và đang cố gắng set IsDeletable = true
            if (!attributeDefinition.IsDeletable && request.IsDeletable == true)
            {
                logger.LogWarning("Cannot set IsDeletable to true for core config AttributeDefinition '{Key}'.",
                    attributeDefinition.Key);
                throw new InvalidOperationException("Không thể cập nhật thuộc tính IsDeletable cho cấu hình hệ thống.");
            }

            var originalDataType = attributeDefinition.DataType;
            DataType? newDataType = null;
            List<ScopeType>? newAllowedScopeTypes = null;

            // Parse DataType và ScopeTypes nếu được cung cấp
            if (!string.IsNullOrWhiteSpace(request.DataType))
                try
                {
                    newDataType = DataType.FromName(request.DataType);
                }
                catch (InvalidOperationException ex)
                {
                    logger.LogWarning(ex, "Invalid DataType provided: {DataType}", request.DataType);
                    throw new InvalidAttributeDefinitionTypeException(ErrorMessages.Settings
                        .InvalidAttributeDefinitionDataTypeOrScopeType);
                }

            if (request.AllowedScopeTypes != null && request.AllowedScopeTypes.Any())
                try
                {
                    newAllowedScopeTypes = request.AllowedScopeTypes.Select(ScopeType.FromName).ToList();
                }
                catch (InvalidOperationException ex)
                {
                    logger.LogWarning(ex, "Invalid ScopeType provided in AllowedScopeTypes");
                    throw new InvalidAttributeDefinitionTypeException(ErrorMessages.Settings
                        .InvalidAttributeDefinitionDataTypeOrScopeType);
                }

            // Kiểm tra nếu DataType thay đổi
            var dataTypeChanged = newDataType != null && !Equals(originalDataType, newDataType);

            if (dataTypeChanged)
            {
                logger.LogInformation(
                    "DataType changed from {OldDataType} to {NewDataType} for AttributeDefinition '{Key}'. " +
                    "All existing settings will be deleted.", originalDataType, newDataType, attributeDefinition.Key);

                // Xóa tất cả Settings liên quan
                var existingSettings = await dbContext.Settings
                    .Where(s => s.AttributeId == attributeDefinition.Id)
                    .ToListAsync(cancellationToken);

                if (existingSettings.Any())
                {
                    dbContext.Settings.RemoveRange(existingSettings);
                    settingsWereDeleted = true;
                    logger.LogInformation(
                        "Deleted {SettingCount} settings for AttributeDefinition '{Key}' due to DataType change.",
                        existingSettings.Count, attributeDefinition.Key);
                }
            }

            // Cập nhật AttributeDefinition
            attributeDefinition.Update(
                request.DisplayName,
                request.Description,
                newDataType,
                newAllowedScopeTypes,
                request.Unit,
                request.DefaultValue,
                request.IsDeletable
            );

            // Xử lý Options
            var optionDtos = new List<OptionDto>();

            // Nếu DataType thay đổi, xử lý Options theo logic mới
            if (dataTypeChanged)
            {
                // Xóa tất cả options cũ nếu DataType cũ là Selection
                if (Equals(originalDataType, DataType.Selection))
                {
                    var oldOptions = attributeDefinition.Options.ToList();
                    foreach (var oldOption in oldOptions) dbContext.Options.Remove(oldOption);

                    attributeDefinition.SetOptions(new List<Option>());
                }

                // Thêm options mới nếu DataType mới là Selection
                if (newDataType != null && Equals(newDataType, DataType.Selection))
                {
                    if (request.Options == null || request.Options.Count == 0)
                    {
                        logger.LogWarning(
                            "DataType changed to 'Selection' but no options provided for AttributeDefinition '{Key}'.",
                            attributeDefinition.Key);
                        throw new SelectionDataTypeRequiresOptionsException();
                    }

                    var newOptions = new List<Option>();
                    foreach (var optionDto in request.Options)
                    {
                        var newOption = Option.Create(
                            attributeDefinition.Id,
                            optionDto.Value,
                            optionDto.DisplayLabel,
                            optionDto.SortOrder
                        );

                        await dbContext.Options.AddAsync(newOption, cancellationToken);
                        newOptions.Add(newOption);

                        optionDtos.Add(new OptionDto
                        {
                            Id = newOption.Id,
                            Value = newOption.Value,
                            DisplayLabel = newOption.DisplayLabel,
                            SortOrder = newOption.SortOrder
                        });
                    }

                    attributeDefinition.SetOptions(newOptions);
                }
            }
            else
            {
                // DataType không thay đổi, xử lý Options bình thường
                if (Equals(attributeDefinition.DataType, DataType.Selection))
                {
                    if (request.Options != null)
                    {
                        // Lấy danh sách options hiện tại
                        var currentOptions = attributeDefinition.Options.ToList();
                        var requestedOptionIds =
                            request.Options.Where(o => o.Id.HasValue).Select(o => o.Id!.Value).ToList();

                        // Xóa các options không có trong request
                        var optionsToRemove = currentOptions.Where(o => !requestedOptionIds.Contains(o.Id)).ToList();
                        foreach (var optionToRemove in optionsToRemove)
                        {
                            dbContext.Options.Remove(optionToRemove);
                            attributeDefinition.RemoveOption(optionToRemove);
                        }

                        // Cập nhật và thêm options
                        var updatedOptions = new List<Option>();
                        foreach (var optionDto in request.Options)
                        {
                            Option option;
                            if (optionDto.Id.HasValue)
                            {
                                // Cập nhật option existing
                                option = currentOptions.FirstOrDefault(o => o.Id == optionDto.Id.Value);
                                if (option != null)
                                {
                                    option.Update(optionDto.Value, optionDto.DisplayLabel, optionDto.SortOrder);
                                    updatedOptions.Add(option);
                                }
                            }
                            else
                            {
                                // Tạo option mới
                                option = Option.Create(
                                    attributeDefinition.Id,
                                    optionDto.Value,
                                    optionDto.DisplayLabel,
                                    optionDto.SortOrder
                                );
                                await dbContext.Options.AddAsync(option, cancellationToken);
                                attributeDefinition.AddOption(option);
                                updatedOptions.Add(option);
                            }

                            optionDtos.Add(new OptionDto
                            {
                                Id = option.Id,
                                Value = option.Value,
                                DisplayLabel = option.DisplayLabel,
                                SortOrder = option.SortOrder
                            });
                        }
                    }
                }
                else
                {
                    // Đảm bảo không có options cho non-Selection DataType
                    var existingOptions = attributeDefinition.Options.ToList();
                    if (existingOptions.Any())
                    {
                        foreach (var option in existingOptions) dbContext.Options.Remove(option);

                        attributeDefinition.SetOptions(new List<Option>());
                    }
                }
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            logger.LogInformation("AttributeDefinition {AttributeId} (Key: '{Key}') updated successfully. " +
                                  "Settings deleted: {SettingsDeleted}",
                attributeDefinition.Id, attributeDefinition.Key, settingsWereDeleted);

            return new UpdateAttributeDefinitionResponse
            {
                AttributeId = attributeDefinition.Id,
                Key = attributeDefinition.Key,
                DisplayName = attributeDefinition.DisplayName,
                Description = attributeDefinition.Description,
                DataType = attributeDefinition.DataType.ToString(),
                AllowedScopeTypes = attributeDefinition.AllowedScopeTypes.Select(ad => ad.ToString()).ToList(),
                Unit = attributeDefinition.Unit,
                DefaultValue = attributeDefinition.DefaultValue,
                IsDeletable = attributeDefinition.IsDeletable,
                CreatedAt = attributeDefinition.CreatedAt,
                UpdatedAt = attributeDefinition.UpdatedAt,
                Options = optionDtos.Any() ? optionDtos : null,
                SettingsWereDeleted = settingsWereDeleted
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
                "An unexpected error occurred while updating AttributeDefinition with ID '{AttributeId}'.",
                command.Details?.AttributeId);
            throw;
        }
    }
}