using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Zentry.Modules.ConfigurationManagement.Dtos;
using Zentry.Modules.ConfigurationManagement.Entities;
using Zentry.Modules.ConfigurationManagement.Persistence;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Configuration;
using Zentry.SharedKernel.Constants.Response;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ConfigurationManagement.Features.CreateAttributeDefinition;

public class CreateAttributeDefinitionCommandHandler(
    ConfigurationDbContext dbContext,
    ILogger<CreateAttributeDefinitionCommandHandler> logger)
    : ICommandHandler<CreateAttributeDefinitionCommand, CreateAttributeDefinitionResponse>
{
    public async Task<CreateAttributeDefinitionResponse> Handle(CreateAttributeDefinitionCommand command,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var request = command.Details;

            DataType attributeDefinitionDataType;
            List<ScopeType> allowedScopeTypes = [];

            try
            {
                attributeDefinitionDataType = DataType.FromName(request.DataType);
                allowedScopeTypes.AddRange(request.AllowedScopeTypes.Select(ScopeType.FromName));
            }
            catch (InvalidOperationException ex)
            {
                logger.LogWarning(ex, "Invalid DataType or ScopeType provided for Attribute Definition: {Message}",
                    ex.Message);
                throw new InvalidAttributeDefinitionTypeException(ErrorMessages.Settings
                    .InvalidAttributeDefinitionDataTypeOrScopeType);
            }

            var existingAttributeDefinition = await dbContext.AttributeDefinitions
                .FirstOrDefaultAsync(ad => ad.Key == request.Key, cancellationToken);

            if (existingAttributeDefinition is not null)
            {
                logger.LogWarning("Attribute Definition with Key '{Key}' already exists.", request.Key);
                throw new AttributeDefinitionKeyAlreadyExistsException(request.Key);
            }

            var attributeDefinition = AttributeDefinition.Create(
                request.Key,
                request.DisplayName,
                request.Description,
                attributeDefinitionDataType,
                allowedScopeTypes,
                request.Unit,
                request.DefaultValue,
                request.IsDeletable
            );
            await dbContext.AttributeDefinitions.AddAsync(attributeDefinition, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);

            List<OptionDto> optionDtos = [];
            if (Equals(attributeDefinition.DataType, DataType.Selection))
            {
                if (request.Options != null && request.Options.Count != 0)
                {
                    var duplicateLabels = request.Options
                        .GroupBy(o => o.DisplayLabel)
                        .Where(g => g.Count() > 1)
                        .Select(g => g.Key)
                        .ToList();

                    if (duplicateLabels.Any())
                    {
                        var duplicated = string.Join(", ", duplicateLabels);
                        logger.LogWarning("Duplicate option labels found: {DuplicatedLabels}", duplicated);
                        throw new DuplicateOptionLabelException(
                            $"Các nhãn hiển thị ('DisplayLabel') không được trùng lặp. Các nhãn bị trùng: {duplicated}"
                        );
                    }

                    foreach (var newOption in request.Options.Select(optionDto => Option.Create(
                                 attributeDefinition.Id,
                                 optionDto.Value,
                                 optionDto.DisplayLabel,
                                 optionDto.SortOrder
                             )))
                    {
                        await dbContext.Options.AddAsync(newOption, cancellationToken);
                        optionDtos.Add(new OptionDto
                        {
                            Id = newOption.Id,
                            Value = newOption.Value,
                            DisplayLabel = newOption.DisplayLabel,
                            SortOrder = newOption.SortOrder
                        });
                    }

                    await dbContext.SaveChangesAsync(cancellationToken);
                }
                else
                {
                    logger.LogWarning(
                        "Attribute Definition with DataType 'Selection' must have options provided for Key '{Key}'.",
                        attributeDefinition.Key);
                    throw new SelectionDataTypeRequiresOptionsException();
                }
            }

            await transaction.CommitAsync(cancellationToken);

            logger.LogInformation(
                "Attribute Definition {AttributeId} (Key: '{Key}') created successfully.",
                attributeDefinition.Id, attributeDefinition.Key);

            return new CreateAttributeDefinitionResponse
            {
                AttributeId = attributeDefinition.Id,
                Key = attributeDefinition.Key,
                DisplayName = attributeDefinition.DisplayName,
                Description = attributeDefinition.Description,
                DataType = attributeDefinition.DataType.ToString(),
                AllowedScopeTypes = attributeDefinition.AllowedScopeTypes.Select(st => st.ToString()).ToList(),
                Unit = attributeDefinition.Unit,
                DefaultValue = attributeDefinition.DefaultValue,
                IsDeletable = attributeDefinition.IsDeletable,
                CreatedAt = attributeDefinition.CreatedAt,
                UpdatedAt = attributeDefinition.UpdatedAt,
                Options = optionDtos.Count != 0 ? optionDtos : null
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
                "An unexpected error occurred while creating Attribute Definition with Key '{Key}'.",
                command.Details?.Key);
            throw;
        }
    }
}