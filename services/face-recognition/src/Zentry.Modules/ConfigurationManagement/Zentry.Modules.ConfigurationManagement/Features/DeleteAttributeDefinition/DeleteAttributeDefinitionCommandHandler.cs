using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Zentry.Modules.ConfigurationManagement.Persistence;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ConfigurationManagement.Features.DeleteAttributeDefinition;

public class DeleteAttributeDefinitionCommandHandler(
    ConfigurationDbContext dbContext,
    ILogger<DeleteAttributeDefinitionCommandHandler> logger)
    : ICommandHandler<DeleteAttributeDefinitionCommand, Unit>
{
    public async Task<Unit> Handle(DeleteAttributeDefinitionCommand command, CancellationToken cancellationToken)
    {
        logger.LogInformation("Attempting to delete AttributeDefinition with ID: {AttributeId}.", command.AttributeId);

        var definitionCheck = await dbContext.AttributeDefinitions
            .AsNoTracking()
            .Where(ad => ad.Id == command.AttributeId)
            .Select(ad => new { ad.IsDeletable })
            .FirstOrDefaultAsync(cancellationToken);

        if (definitionCheck is null)
        {
            logger.LogWarning("Delete failed: AttributeDefinition with ID {AttributeId} not found.",
                command.AttributeId);
            throw new ResourceNotFoundException("AttributeDefinition", command.AttributeId);
        }

        if (!definitionCheck.IsDeletable)
        {
            logger.LogWarning(
                "Deletion of AttributeDefinition {AttributeId} is not allowed. It is a core configuration.",
                command.AttributeId);
            throw new BusinessRuleException("CANNOT_DELETE_CORE_ATTRIBUTE",
                "Không thể xóa thuộc tính cấu hình cốt lõi.");
        }

        await dbContext.Options
            .Where(o => o.AttributeId == command.AttributeId)
            .ExecuteDeleteAsync(cancellationToken);

        await dbContext.Settings
            .Where(s => s.AttributeId == command.AttributeId)
            .ExecuteDeleteAsync(cancellationToken);

        var affectedRows = await dbContext.AttributeDefinitions
            .Where(ad => ad.Id == command.AttributeId)
            .ExecuteDeleteAsync(cancellationToken);

        if (affectedRows == 0)
        {
            logger.LogWarning("Delete failed: AttributeDefinition with ID {AttributeId} not found after checks.",
                command.AttributeId);
            throw new ResourceNotFoundException("AttributeDefinition", command.AttributeId);
        }

        logger.LogInformation("Successfully deleted AttributeDefinition {AttributeId} and related entities.",
            command.AttributeId);

        return Unit.Value;
    }
}