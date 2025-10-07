using Microsoft.Extensions.Logging;
using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Schedule;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ScheduleManagement.Application.Integration;

public class RemoveStudentEnrollmentCommandHandler(
    IEnrollmentRepository enrollmentRepository,
    ILogger<RemoveStudentEnrollmentCommandHandler> logger)
    : ICommandHandler<RemoveStudentEnrollmentIntegrationCommand, RemoveStudentEnrollmentIntegrationResponse>
{
    public async Task<RemoveStudentEnrollmentIntegrationResponse> Handle(
        RemoveStudentEnrollmentIntegrationCommand request,
        CancellationToken cancellationToken)
    {
        logger.LogInformation("Starting enrollment removal for StudentId: {StudentId}", request.StudentId);

        try
        {
            var enrollments = await enrollmentRepository.GetEnrollmentsByStudentIdAsync(
                request.StudentId,
                cancellationToken);

            if (enrollments.Count == 0)
            {
                logger.LogInformation("No enrollments found for StudentId: {StudentId}", request.StudentId);
                return new RemoveStudentEnrollmentIntegrationResponse(
                    true,
                    "No enrollments to remove for this student.");
            }

            logger.LogInformation("Found {EnrollmentCount} enrollments to remove for StudentId: {StudentId}",
                enrollments.Count, request.StudentId);

            try
            {
                await enrollmentRepository.DeleteRangeAsync(enrollments, cancellationToken);
                await enrollmentRepository.SaveChangesAsync(cancellationToken);

                logger.LogInformation("Successfully removed {EnrollmentCount} enrollments for StudentId: {StudentId}",
                    enrollments.Count, request.StudentId);

                return new RemoveStudentEnrollmentIntegrationResponse(
                    true,
                    $"Successfully removed {enrollments.Count} enrollments.");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error occurred while removing enrollments for StudentId: {StudentId}",
                    request.StudentId);

                try
                {
                    logger.LogWarning(
                        "Enrollment removal failed for StudentId: {StudentId}, operation will be rolled back by the calling handler",
                        request.StudentId);
                }
                catch (Exception restoreEx)
                {
                    logger.LogCritical(restoreEx,
                        "CRITICAL: Failed to restore enrollments for StudentId: {StudentId}. Manual intervention required!",
                        request.StudentId);
                }

                return new RemoveStudentEnrollmentIntegrationResponse(
                    false,
                    $"Failed to remove enrollments: {ex.Message}");
            }
        }
        catch (ResourceNotFoundException ex)
        {
            logger.LogWarning(
                "Resource not found while removing enrollments for StudentId: {StudentId}. Error: {Error}",
                request.StudentId, ex.Message);
            return new RemoveStudentEnrollmentIntegrationResponse(false, ex.Message);
        }
        catch (BusinessRuleException ex)
        {
            logger.LogWarning(
                "Business rule violation while removing enrollments for StudentId: {StudentId}. Error: {Error}",
                request.StudentId, ex.Message);
            return new RemoveStudentEnrollmentIntegrationResponse(false, ex.Message);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unexpected error while removing enrollments for StudentId: {StudentId}",
                request.StudentId);
            return new RemoveStudentEnrollmentIntegrationResponse(
                false,
                $"An unexpected error occurred: {ex.Message}");
        }
    }
}