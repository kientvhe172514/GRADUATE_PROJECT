using MassTransit;
using MediatR;
using Microsoft.Extensions.Logging;
using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Events;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Schedules.SoftDeleteSchedule;

public class SoftDeleteScheduleCommandHandler(
    IScheduleRepository scheduleRepository,
    IPublishEndpoint publishEndpoint,
    ILogger<SoftDeleteScheduleCommandHandler> logger)
    : ICommandHandler<SoftDeleteScheduleCommand, Unit>
{
    public async Task<Unit> Handle(SoftDeleteScheduleCommand command, CancellationToken cancellationToken)
    {
        logger.LogInformation("Attempting to soft delete schedule {ScheduleId}.", command.ScheduleId);

        var schedule = await scheduleRepository.GetByIdAsync(command.ScheduleId, cancellationToken);
        if (schedule is null)
        {
            logger.LogWarning("SoftDeleteSchedule failed: Schedule with ID {ScheduleId} not found.",
                command.ScheduleId);
            throw new ResourceNotFoundException("Schedule", $"ID '{command.ScheduleId}' not found.");
        }

        // Thực hiện soft delete
        await scheduleRepository.SoftDeleteAsync(schedule, cancellationToken);
        logger.LogInformation("Schedule {ScheduleId} soft deleted successfully.", schedule.Id);

        var scheduleDeletedEvent = new ScheduleDeletedMessage(schedule.Id);

        await publishEndpoint.Publish(scheduleDeletedEvent, cancellationToken);
        logger.LogInformation("ScheduleDeletedMessage published for ScheduleId: {ScheduleId}.", schedule.Id);

        return Unit.Value;
    }
}