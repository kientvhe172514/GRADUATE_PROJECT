using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Zentry.Modules.ConfigurationManagement.Persistence;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ConfigurationManagement.Features.DeleteSetting;

public class DeleteSettingCommandHandler(
    ConfigurationDbContext dbContext,
    ILogger<DeleteSettingCommandHandler> logger)
    : ICommandHandler<DeleteSettingCommand, Unit>
{
    public async Task<Unit> Handle(DeleteSettingCommand command, CancellationToken cancellationToken)
    {
        logger.LogInformation("Attempting to delete Setting with ID: {SettingId}.", command.SettingId);

        var setting = await dbContext.Settings
            .FirstOrDefaultAsync(s => s.Id == command.SettingId, cancellationToken);

        if (setting is null)
        {
            logger.LogWarning("Delete failed: Setting with ID {SettingId} not found.", command.SettingId);
            throw new ResourceNotFoundException("Setting", command.SettingId);
        }

        dbContext.Settings.Remove(setting);
        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Successfully deleted Setting {SettingId}.", command.SettingId);

        return Unit.Value;
    }
}