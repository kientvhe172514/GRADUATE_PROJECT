using MassTransit;
using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.Modules.ScheduleManagement.Application.Services;
using Zentry.Modules.ScheduleManagement.Domain.Entities;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.User;
using Zentry.SharedKernel.Contracts.Events;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Enrollments.EnrollStudent;

public class EnrollStudentCommandHandler(
    IEnrollmentRepository enrollmentRepository,
    IClassSectionRepository classSectionRepository,
    IUserScheduleService userLookupService,
    IPublishEndpoint publishEndpoint)
    : ICommandHandler<EnrollStudentCommand, EnrollmentResponse>
{
    public async Task<EnrollmentResponse> Handle(EnrollStudentCommand command, CancellationToken cancellationToken)
    {
        var studentUser =
            await userLookupService.GetUserByIdAndRoleAsync(Role.Student, command.StudentId, cancellationToken);
        if (studentUser == null)
            throw new ResourceNotFoundException("STUDENT", command.StudentId);

        var classSection = await classSectionRepository.GetByIdAsync(command.ClassSectionId, cancellationToken);
        if (classSection is null)
            throw new ResourceNotFoundException("ClassSection", command.ClassSectionId);

        var alreadyEnrolled =
            await enrollmentRepository.IsEnrolledAsync(command.StudentId, command.ClassSectionId, cancellationToken);
        if (alreadyEnrolled)
            throw new UserAlreadyExistsException(command.StudentId.ToString());

        var enrollment = Enrollment.Create(command.StudentId, command.ClassSectionId);

        await enrollmentRepository.AddAsync(enrollment, cancellationToken);
        await enrollmentRepository.SaveChangesAsync(cancellationToken);

        // Publish event để update whitelist
        var studentEnrolledMessage = new StudentEnrolledMessage(command.StudentId, command.ClassSectionId);
        await publishEndpoint.Publish(studentEnrolledMessage, cancellationToken);

        return new EnrollmentResponse
        {
            EnrollmentId = enrollment.Id,
            ClassSectionId = enrollment.ClassSectionId,
            StudentId = enrollment.StudentId,
            StudentName = studentUser.FullName ?? "Unknown Student",
            EnrollmentDate = enrollment.EnrolledAt,
            Status = enrollment.Status.ToString()
        };
    }
}