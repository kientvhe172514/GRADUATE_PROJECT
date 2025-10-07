using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ScheduleManagement.Application.Features.ClassSections.UpdateClassSection;

public class UpdateClassSectionCommandHandler(
    IScheduleRepository scheduleRepository,
    IClassSectionRepository classSectionRepository)
    : ICommandHandler<UpdateClassSectionCommand, bool>
{
    public async Task<bool> Handle(UpdateClassSectionCommand command, CancellationToken cancellationToken)
    {
        var classSection = await classSectionRepository.GetByIdAsync(command.Id, cancellationToken);

        if (classSection is null || classSection.IsDeleted)
            throw new ResourceNotFoundException("Class Section", command.Id);

        var hasActiveSchedule =
            await scheduleRepository.HasActiveScheduleByClassSectionIdAsync(classSection.Id, cancellationToken);

        if (hasActiveSchedule)
            throw new ScheduleConflictException(
                $"Class section with ID '{classSection.Id}' can not be updated because it  is already active.");

        if (command.SectionCode != null &&
            await classSectionRepository.IsExistClassSectionBySectionCodeAsync(command.Id, command.SectionCode,
                cancellationToken))
            throw new ResourceAlreadyExistsException("Class Section", command.SectionCode);

        classSection.Update(command.SectionCode, command.Semester);
        await classSectionRepository.UpdateAsync(classSection, cancellationToken);
        await classSectionRepository.SaveChangesAsync(cancellationToken);

        return true;
    }
}