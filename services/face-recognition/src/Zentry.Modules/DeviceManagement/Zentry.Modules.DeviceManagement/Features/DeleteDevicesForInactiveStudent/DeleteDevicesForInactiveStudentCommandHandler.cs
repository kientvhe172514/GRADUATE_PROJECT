using MediatR;
using Microsoft.Extensions.Logging;
using Zentry.Modules.DeviceManagement.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.User;
using Zentry.SharedKernel.Contracts.User;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.DeviceManagement.Features.DeleteDevicesForInactiveStudent;

public class DeleteDevicesForInactiveStudentCommandHandler(
    IDeviceRepository deviceRepository,
    IMediator mediator,
    ILogger<DeleteDevicesForInactiveStudentCommandHandler> logger)
    : ICommandHandler<DeleteDevicesForInactiveStudentCommand, Unit>
{
    public async Task<Unit> Handle(DeleteDevicesForInactiveStudentCommand command, CancellationToken cancellationToken)
    {
        logger.LogInformation("Attempting to delete devices for student ID: {StudentId}.", command.StudentId);

        var userStatusResponse =
            await mediator.Send(new GetUserStatusIntegrationQuery(command.StudentId), cancellationToken);

        if (!Equals(userStatusResponse.Status, AccountStatus.Inactive))
        {
            logger.LogWarning(
                "Delete devices failed for student ID {StudentId}: Student is not inactive. Current status: {Status}.",
                command.StudentId, userStatusResponse.Status);
            throw new BusinessRuleException("STUDENT_NOT_INACTIVE",
                "Chỉ có thể xóa thiết bị của sinh viên không hoạt động (Inactive).");
        }

        var devices = await deviceRepository.GetByAccountIdAsync(command.StudentId, cancellationToken);

        var enumerable = devices.ToList();
        if (enumerable.Count == 0)
        {
            logger.LogInformation("No devices found for student ID {StudentId}.", command.StudentId);
            return Unit.Value;
        }

        await deviceRepository.DeleteRangeAsync(enumerable, cancellationToken);
        logger.LogInformation("Successfully deleted {DeviceCount} devices for student ID {StudentId}.",
            enumerable.Count(),
            command.StudentId);

        return Unit.Value;
    }
}