using MassTransit;
using MediatR;
using Microsoft.Extensions.Logging;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.Modules.AttendanceManagement.Domain.Entities;
using Zentry.SharedKernel.Contracts.Device;
using Zentry.SharedKernel.Contracts.Events;
using Zentry.SharedKernel.Contracts.Schedule;

namespace Zentry.Modules.AttendanceManagement.Application.EventHandlers;

public class GenerateScheduleWhitelistConsumer(
    ILogger<GenerateScheduleWhitelistConsumer> logger,
    IScheduleWhitelistRepository scheduleWhitelistRepository,
    IMediator mediator)
    : IConsumer<ScheduleCreatedMessage>, IConsumer<AssignLecturerToWhitelistMessage>
{
    public async Task Consume(ConsumeContext<AssignLecturerToWhitelistMessage> consumeContext)
    {
        var message = consumeContext.Message;
        logger.LogInformation(
            "MassTransit Consumer: Received request to assign lecturer {LecturerId} to whitelist for Schedule: {ScheduleId}.",
            message.LecturerId, message.ScheduleId);

        if (message.LecturerId == null || message.LecturerId.Value == Guid.Empty)
        {
            logger.LogWarning("LecturerId is null or empty. Skipping whitelist update for Schedule {ScheduleId}.",
                message.ScheduleId);
            return;
        }

        try
        {
            // Lấy device của lecturer trước
            var getLecturerDeviceQuery = new GetDeviceByUserIntegrationQuery(message.LecturerId.Value);
            var lecturerDeviceResponse = await mediator.Send(getLecturerDeviceQuery, consumeContext.CancellationToken);

            if (lecturerDeviceResponse.DeviceId == Guid.Empty)
            {
                logger.LogWarning("Lecturer {LecturerId} does not have an associated device. Whitelist not updated.",
                    message.LecturerId);
                return;
            }

            // Sử dụng UpsertAsync thay vì check exist rồi Add/Update
            await UpsertScheduleWhitelistWithLecturer(
                message.ScheduleId,
                lecturerDeviceResponse.DeviceId,
                consumeContext.CancellationToken);

            logger.LogInformation(
                "Successfully processed lecturer assignment for Schedule {ScheduleId} with device {DeviceId}.",
                message.ScheduleId, lecturerDeviceResponse.DeviceId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "MassTransit Consumer: Error assigning lecturer to whitelist for Schedule {ScheduleId}.",
                message.ScheduleId);
            throw;
        }
    }

    public async Task Consume(ConsumeContext<ScheduleCreatedMessage> consumeContext)
    {
        var message = consumeContext.Message;
        logger.LogInformation(
            "MassTransit Consumer: Received request to generate/update whitelist for Schedule: {ScheduleId}.",
            message.ScheduleId);

        try
        {
            var whitelistedDeviceIds = new HashSet<Guid>();

            // Lấy student devices
            var getStudentIdsQuery = new GetStudentIdsByClassSectionIdIntegrationQuery(message.ClassSectionId);
            var studentIdsResponse = await mediator.Send(getStudentIdsQuery, consumeContext.CancellationToken);
            var enrolledStudentIds = studentIdsResponse.StudentIds;

            if (enrolledStudentIds.Any())
            {
                var getStudentDevicesQuery = new GetDevicesByUsersIntegrationQuery(enrolledStudentIds);
                var studentDevicesResponse =
                    await mediator.Send(getStudentDevicesQuery, consumeContext.CancellationToken);
                foreach (var deviceId in studentDevicesResponse.UserDeviceMap.Values)
                    whitelistedDeviceIds.Add(deviceId);

                logger.LogInformation("Found {Count} student devices from {StudentCount} enrolled students.",
                    studentDevicesResponse.UserDeviceMap.Count, enrolledStudentIds.Count);
            }

            // Lấy lecturer device nếu có
            if (message.LecturerId.HasValue && message.LecturerId.Value != Guid.Empty)
            {
                var getLecturerDeviceQuery = new GetDeviceByUserIntegrationQuery(message.LecturerId.Value);
                var lecturerDeviceResponse =
                    await mediator.Send(getLecturerDeviceQuery, consumeContext.CancellationToken);
                if (lecturerDeviceResponse.DeviceId != Guid.Empty)
                {
                    whitelistedDeviceIds.Add(lecturerDeviceResponse.DeviceId);
                    logger.LogInformation("Found lecturer's device to add to whitelist.");
                }
            }

            // Sử dụng UpsertAsync
            await UpsertScheduleWhitelist(
                message.ScheduleId,
                whitelistedDeviceIds.ToList(),
                consumeContext.CancellationToken);

            logger.LogInformation(
                "Successfully processed whitelist for Schedule {ScheduleId} with {DeviceCount} total devices.",
                message.ScheduleId, whitelistedDeviceIds.Count);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "MassTransit Consumer: Error generating/updating whitelist for Schedule {ScheduleId}.",
                message.ScheduleId);
            throw;
        }
    }

    private async Task UpsertScheduleWhitelistWithLecturer(Guid scheduleId, Guid lecturerDeviceId,
        CancellationToken cancellationToken)
    {
        var existingWhitelist = await scheduleWhitelistRepository.GetByScheduleIdAsync(scheduleId, cancellationToken);

        if (existingWhitelist != null)
        {
            // Update existing whitelist
            var whitelistedDeviceIds = new HashSet<Guid>(existingWhitelist.WhitelistedDeviceIds);

            if (whitelistedDeviceIds.Add(lecturerDeviceId))
            {
                existingWhitelist.UpdateWhitelist(whitelistedDeviceIds.ToList());
                await scheduleWhitelistRepository.UpdateAsync(existingWhitelist, cancellationToken);
                logger.LogInformation(
                    "Successfully added lecturer's device {DeviceId} to existing whitelist for Schedule {ScheduleId}.",
                    lecturerDeviceId, scheduleId);
            }
            else
            {
                logger.LogInformation(
                    "Lecturer's device {DeviceId} for Schedule {ScheduleId} already exists in the whitelist.",
                    lecturerDeviceId, scheduleId);
            }
        }
        else
        {
            // Create new whitelist with just the lecturer device
            var whitelistedDeviceIds = new List<Guid> { lecturerDeviceId };
            var newWhitelist = ScheduleWhitelist.Create(scheduleId, whitelistedDeviceIds);

            // Use UpsertAsync instead of AddAsync to handle race conditions
            await scheduleWhitelistRepository.UpsertAsync(newWhitelist, cancellationToken);
            logger.LogInformation(
                "Successfully created new ScheduleWhitelist for Schedule {ScheduleId} with lecturer's device {DeviceId}.",
                scheduleId, lecturerDeviceId);
        }
    }

    private async Task UpsertScheduleWhitelist(Guid scheduleId, List<Guid> deviceIds,
        CancellationToken cancellationToken)
    {
        var existingWhitelist = await scheduleWhitelistRepository.GetByScheduleIdAsync(scheduleId, cancellationToken);

        if (existingWhitelist != null)
        {
            // Merge với existing devices
            var whitelistedDeviceIds = new HashSet<Guid>(existingWhitelist.WhitelistedDeviceIds);
            var initialCount = whitelistedDeviceIds.Count;

            foreach (var deviceId in deviceIds)
                whitelistedDeviceIds.Add(deviceId);

            var addedCount = whitelistedDeviceIds.Count - initialCount;

            if (addedCount > 0)
            {
                existingWhitelist.UpdateWhitelist(whitelistedDeviceIds.ToList());
                await scheduleWhitelistRepository.UpdateAsync(existingWhitelist, cancellationToken);
                logger.LogInformation(
                    "Successfully updated existing ScheduleWhitelist for Schedule {ScheduleId}. Added {AddedCount} new devices, total: {TotalCount}.",
                    scheduleId, addedCount, whitelistedDeviceIds.Count);
            }
            else
            {
                logger.LogInformation(
                    "No new devices to add for existing ScheduleWhitelist {ScheduleId}.",
                    scheduleId);
            }
        }
        else
        {
            // Create new whitelist
            var newWhitelist = ScheduleWhitelist.Create(scheduleId, deviceIds);

            // Use UpsertAsync instead of AddAsync to handle race conditions
            await scheduleWhitelistRepository.UpsertAsync(newWhitelist, cancellationToken);
            logger.LogInformation(
                "Successfully created new ScheduleWhitelist for Schedule {ScheduleId} with {DeviceCount} devices.",
                scheduleId, deviceIds.Count);
        }
    }
}