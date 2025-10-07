using MassTransit;
using MediatR;
using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Events;
using Zentry.SharedKernel.Contracts.User;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ScheduleManagement.Application.Features.ClassSections.AssignLecturer;

public class AssignLecturerCommandHandler(
    IScheduleRepository scheduleRepository,
    IClassSectionRepository classSectionRepository,
    IMediator mediator,
    IPublishEndpoint publishEndpoint)
    : ICommandHandler<AssignLecturerCommand, AssignLecturerResponse>
{
    public async Task<AssignLecturerResponse> Handle(AssignLecturerCommand command, CancellationToken cancellationToken)
    {
        var response = await mediator.Send(new CheckUserExistIntegrationQuery(command.LecturerId), cancellationToken);
        if (response.IsExist == false) throw new UserNotFoundException(command.LecturerId);

        var classSection = await classSectionRepository.GetByIdAsync(command.ClassSectionId, cancellationToken);
        if (classSection is null) throw new ResourceNotFoundException("ClassSection", command.ClassSectionId);

        if (classSection.LecturerId.HasValue)
        {
            var hasActiveSchedule =
                await scheduleRepository.HasActiveScheduleByClassSectionIdAsync(classSection.Id, cancellationToken);

            if (hasActiveSchedule)
                throw new ScheduleConflictException(
                    $"Class section with ID '{command.ClassSectionId}' can not be updated because it  is already active.");
        }

        classSection.AssignLecturer(command.LecturerId);
        await classSectionRepository.UpdateAsync(classSection, cancellationToken);
        await classSectionRepository.SaveChangesAsync(cancellationToken);

        var message = new AssignLecturerMessage(
            classSection.Id,
            command.LecturerId);

        await publishEndpoint.Publish(message, cancellationToken);

        return new AssignLecturerResponse(
            classSection.Id,
            command.LecturerId,
            true
        );
    }
}