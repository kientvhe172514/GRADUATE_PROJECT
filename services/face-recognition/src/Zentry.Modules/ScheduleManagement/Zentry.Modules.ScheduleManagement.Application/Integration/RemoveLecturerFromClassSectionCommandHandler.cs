using Microsoft.Extensions.Logging;
using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Schedule;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ScheduleManagement.Application.Integration;

public class RemoveLecturerFromClassSectionCommandHandler(
    IClassSectionRepository classSectionRepository,
    ILogger<RemoveLecturerFromClassSectionCommandHandler> logger)
    : ICommandHandler<RemoveLecturerFromClassSectionIntegrationCommand,
        RemoveLecturerFromClassSectionIntegrationResponse>
{
    public async Task<RemoveLecturerFromClassSectionIntegrationResponse> Handle(
        RemoveLecturerFromClassSectionIntegrationCommand request,
        CancellationToken cancellationToken)
    {
        logger.LogInformation("Starting lecturer removal from class sections for LecturerId: {LecturerId}",
            request.LecturerId);

        try
        {
            var classSections = await classSectionRepository.GetLecturerClassSectionsAsync(
                request.LecturerId,
                cancellationToken);

            if (classSections.Count == 0)
            {
                logger.LogInformation("No class sections found for LecturerId: {LecturerId}", request.LecturerId);
                return new RemoveLecturerFromClassSectionIntegrationResponse(
                    true,
                    "No class sections to remove lecturer from.");
            }

            logger.LogInformation(
                "Found {ClassSectionCount} class sections to remove lecturer from for LecturerId: {LecturerId}",
                classSections.Count, request.LecturerId);

            try
            {
                // Remove lecturer from all class sections by setting LecturerId to null
                foreach (var classSection in classSections) classSection.AssignLecturer(null);

                // Update all class sections at once
                await classSectionRepository.UpdateRangeAsync(classSections, cancellationToken);

                logger.LogInformation(
                    "Successfully removed lecturer from {ClassSectionCount} class sections for LecturerId: {LecturerId}",
                    classSections.Count, request.LecturerId);

                return new RemoveLecturerFromClassSectionIntegrationResponse(
                    true,
                    $"Successfully removed lecturer from {classSections.Count} class sections.");
            }
            catch (Exception ex)
            {
                logger.LogError(ex,
                    "Error occurred while removing lecturer from class sections for LecturerId: {LecturerId}",
                    request.LecturerId);

                logger.LogWarning(
                    "Lecturer removal failed for LecturerId: {LecturerId}, operation will be rolled back by the calling handler",
                    request.LecturerId);

                return new RemoveLecturerFromClassSectionIntegrationResponse(
                    false,
                    $"Failed to remove lecturer from class sections: {ex.Message}");
            }
        }
        catch (ResourceNotFoundException ex)
        {
            logger.LogWarning(
                "Resource not found while removing lecturer from class sections for LecturerId: {LecturerId}. Error: {Error}",
                request.LecturerId, ex.Message);
            return new RemoveLecturerFromClassSectionIntegrationResponse(false, ex.Message);
        }
        catch (BusinessRuleException ex)
        {
            logger.LogWarning(
                "Business rule violation while removing lecturer from class sections for LecturerId: {LecturerId}. Error: {Error}",
                request.LecturerId, ex.Message);
            return new RemoveLecturerFromClassSectionIntegrationResponse(false, ex.Message);
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Unexpected error while removing lecturer from class sections for LecturerId: {LecturerId}",
                request.LecturerId);
            return new RemoveLecturerFromClassSectionIntegrationResponse(
                false,
                $"An unexpected error occurred: {ex.Message}");
        }
    }
}