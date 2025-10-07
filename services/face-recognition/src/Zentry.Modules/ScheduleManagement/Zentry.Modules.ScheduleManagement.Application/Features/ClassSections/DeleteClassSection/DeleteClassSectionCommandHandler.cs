using MassTransit;
using Microsoft.Extensions.Logging;
using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Events;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ScheduleManagement.Application.Features.ClassSections.DeleteClassSection;

public class DeleteClassSectionCommandHandler(
    IClassSectionRepository classSectionRepository,
    IScheduleRepository scheduleRepository,
    IPublishEndpoint publishEndpoint,
    ILogger<DeleteClassSectionCommandHandler> logger)
    : ICommandHandler<DeleteClassSectionCommand, bool>
{
    public async Task<bool> Handle(DeleteClassSectionCommand command, CancellationToken cancellationToken)
    {
        var classSection = await classSectionRepository.GetByIdAsync(command.Id, cancellationToken);

        if (classSection is null)
            throw new ResourceNotFoundException("CLASS SECTION", command.Id);

        if (classSection.Enrollments.Count != 0)
        {
            var hasActiveSchedule =
                await scheduleRepository.HasActiveScheduleByClassSectionIdAsync(classSection.Id, cancellationToken);

            if (hasActiveSchedule)
            {
                var schedulesToDelete =
                    await scheduleRepository.GetSchedulesByClassSectionIdAsync(command.Id, cancellationToken);

                foreach (var schedule in schedulesToDelete)
                    try
                    {
                        await publishEndpoint.Publish(
                            new ScheduleDeletedMessage(schedule.Id),
                            cancellationToken);

                        logger.LogInformation(
                            "Published ScheduleDeletedMessage for ScheduleId: {ScheduleId} of ClassSectionId: {ClassSectionId}",
                            schedule.Id, command.Id);
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(ex,
                            "Failed to publish ScheduleDeletedMessage for ScheduleId: {ScheduleId} of ClassSectionId: {ClassSectionId}",
                            schedule.Id, command.Id);
                        throw;
                    }

                await scheduleRepository.DeleteRangeAsync(schedulesToDelete, cancellationToken);

                logger.LogInformation(
                    "Successfully deleted {ScheduleCount} schedules for ClassSectionId: {ClassSectionId}",
                    schedulesToDelete.Count, command.Id);
            }

            await classSectionRepository.SoftDeleteAsync(command.Id, cancellationToken);
            logger.LogInformation("Soft deleted ClassSection with Id: {ClassSectionId}", command.Id);
            return true;
        }

        await classSectionRepository.DeleteAsync(classSection, cancellationToken);
        logger.LogInformation("Hard deleted ClassSection with Id: {ClassSectionId}", command.Id);
        return true;
    }
}
