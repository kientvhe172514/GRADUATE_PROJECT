using MassTransit;
using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.Modules.ScheduleManagement.Application.Services;
using Zentry.Modules.ScheduleManagement.Domain.Entities;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.User;
using Zentry.SharedKernel.Contracts.Events;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Enrollments.EnrollMultipleStudents;

public class BulkEnrollStudentsCommandHandler(
    IEnrollmentRepository enrollmentRepository,
    IClassSectionRepository classSectionRepository,
    IUserScheduleService userLookupService,
    IPublishEndpoint publishEndpoint)
    : ICommandHandler<BulkEnrollStudentsCommand, BulkEnrollmentResponse>
{
    public async Task<BulkEnrollmentResponse> Handle(BulkEnrollStudentsCommand command,
        CancellationToken cancellationToken)
    {
        var response = new BulkEnrollmentResponse
        {
            ClassSectionId = command.ClassSectionId,
            TotalStudents = command.StudentIds.Count
        };

        // Validate class section exists
        var classSection = await classSectionRepository.GetByIdAsync(command.ClassSectionId, cancellationToken);
        if (classSection is null) throw new NotFoundException("ClassSection", command.ClassSectionId);

        // Get existing enrollments for this class section to avoid duplicates
        var existingEnrollments = await enrollmentRepository
            .GetEnrollmentsByClassSectionAsync(command.ClassSectionId, cancellationToken);

        var existingStudentIds = existingEnrollments.Select(e => e.StudentId).ToHashSet();

        var enrollmentsToAdd = new List<Enrollment>();
        var successfulStudentIds = new List<Guid>();
        var successCount = 0;
        var failedCount = 0;

        foreach (var studentId in command.StudentIds)
        {
            var result = new EnrollmentResult
            {
                StudentId = studentId
            };

            try
            {
                // Check if already enrolled
                if (existingStudentIds.Contains(studentId))
                {
                    result.IsSuccess = false;
                    result.ErrorMessage = "Student already enrolled in this class section";
                    failedCount++;
                    response.Results.Add(result);
                    continue;
                }

                // Validate student exists and has correct role
                var studentUser =
                    await userLookupService.GetUserByIdAndRoleAsync(Role.Student, studentId, cancellationToken);
                if (studentUser == null)
                {
                    result.IsSuccess = false;
                    result.ErrorMessage = "Student not found or invalid role";
                    result.StudentName = "Unknown Student";
                    failedCount++;
                    response.Results.Add(result);
                    continue;
                }

                // Create enrollment
                var enrollment = Enrollment.Create(studentId, command.ClassSectionId);
                enrollmentsToAdd.Add(enrollment);

                result.IsSuccess = true;
                result.StudentName = studentUser.FullName ?? "Unknown Student";
                result.EnrollmentId = enrollment.Id;
                result.EnrollmentDate = enrollment.EnrolledAt;
                successCount++;
                successfulStudentIds.Add(studentId);

                // Add to existing enrollments set to prevent duplicates in the same batch
                existingStudentIds.Add(studentId);
            }
            catch (Exception ex)
            {
                result.IsSuccess = false;
                result.ErrorMessage = ex.Message;
                result.StudentName = "Unknown Student";
                failedCount++;
            }

            response.Results.Add(result);
        }

        // Bulk add enrollments if any successful ones
        if (enrollmentsToAdd.Count != 0)
            try
            {
                await enrollmentRepository.BulkAddAsync(enrollmentsToAdd, cancellationToken);
                await enrollmentRepository.SaveChangesAsync(cancellationToken);

                // Publish event với danh sách student đã enroll thành công
                if (successfulStudentIds.Any())
                {
                    var studentEnrolledMessage = new StudentEnrolledMessage(
                        Guid.Empty, // Single student ID không cần thiết cho bulk
                        command.ClassSectionId,
                        successfulStudentIds);
                    await publishEndpoint.Publish(studentEnrolledMessage, cancellationToken);
                }
            }
            catch (Exception ex)
            {
                // If bulk save fails, mark all as failed
                foreach (var result in response.Results.Where(r => r.IsSuccess))
                {
                    result.IsSuccess = false;
                    result.ErrorMessage = "Failed to save enrollment: " + ex.Message;
                    result.EnrollmentId = null;
                    result.EnrollmentDate = null;
                }

                successCount = 0;
                failedCount = response.Results.Count;
                successfulStudentIds.Clear();

                response.Errors.Add($"Bulk save failed: {ex.Message}");
            }

        response.SuccessfulEnrollments = successCount;
        response.FailedEnrollments = failedCount;

        return response;
    }
}