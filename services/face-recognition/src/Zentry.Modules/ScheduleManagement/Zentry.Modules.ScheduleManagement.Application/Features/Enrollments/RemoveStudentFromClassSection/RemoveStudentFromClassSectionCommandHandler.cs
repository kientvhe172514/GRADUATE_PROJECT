using MediatR;
using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.Modules.ScheduleManagement.Domain.Entities;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.User;
using Zentry.SharedKernel.Contracts.User;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Enrollments.RemoveStudentFromClassSection;

public class RemoveStudentFromClassSectionCommandHandler(
    IEnrollmentRepository enrollmentRepository,
    IClassSectionRepository classSectionRepository,
    IMediator mediator)
    : ICommandHandler<RemoveStudentFromClassSectionCommand, RemoveEnrollmentByStudentResponse>
{
    public async Task<RemoveEnrollmentByStudentResponse> Handle(RemoveStudentFromClassSectionCommand request,
        CancellationToken cancellationToken)
    {
        var classSection = await classSectionRepository.GetByIdAsync(request.ClassSectionId, cancellationToken);
        if (classSection is null) throw new ResourceNotFoundException(nameof(ClassSection), request.ClassSectionId);


        try
        {
            await mediator.Send(
                new GetUserByIdAndRoleIntegrationQuery(request.StudentId, Role.Student), cancellationToken);
        }
        catch (ResourceNotFoundException e)
        {
            throw new ResourceNotFoundException(e.Message, e);
        }

        await enrollmentRepository.DeleteAsync(request.StudentId, request.ClassSectionId, cancellationToken);
        return new RemoveEnrollmentByStudentResponse
        {
            Status = true
        };
    }
}