using MassTransit;
using MediatR;
using Microsoft.Extensions.Logging;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.Modules.AttendanceManagement.Domain.Entities;
using Zentry.SharedKernel.Contracts.Device;
using Zentry.SharedKernel.Contracts.Events;
using Zentry.SharedKernel.Contracts.Schedule;

namespace Zentry.Modules.AttendanceManagement.Application.EventHandlers;

public class StudentEnrollmentWhitelistConsumer(
    ILogger<StudentEnrollmentWhitelistConsumer> logger,
    IScheduleWhitelistRepository scheduleWhitelistRepository,
    IMediator mediator)
    : IConsumer<StudentEnrolledMessage>
{
    public async Task Consume(ConsumeContext<StudentEnrolledMessage> consumeContext)
    {
        var message = consumeContext.Message;
        logger.LogInformation(
            "MassTransit Consumer: Received student enrollment for ClassSection: {ClassSectionId}.",
            message.ClassSectionId);

        try
        {
            // Lấy danh sách student IDs cần thêm vào whitelist
            var studentIds = message.EnrolledStudentIds?.Any() == true
                ? message.EnrolledStudentIds
                : new List<Guid> { message.StudentId };

            if (!studentIds.Any())
            {
                logger.LogWarning("No student IDs provided for whitelist update.");
                return;
            }

            // Lấy danh sách schedules cho ClassSection này
            var getSchedulesByClassSectionQuery =
                new GetSchedulesByClassSectionIdIntegrationQuery(message.ClassSectionId);
            var schedulesResponse =
                await mediator.Send(getSchedulesByClassSectionQuery, consumeContext.CancellationToken);

            if (!schedulesResponse.Schedules.Any())
            {
                logger.LogInformation(
                    "No schedules found for ClassSection {ClassSectionId}. Skipping whitelist update.",
                    message.ClassSectionId);
                return;
            }

            // Lấy devices của các students
            var getStudentDevicesQuery = new GetDevicesByUsersIntegrationQuery(studentIds);
            var studentDevicesResponse = await mediator.Send(getStudentDevicesQuery, consumeContext.CancellationToken);

            if (!studentDevicesResponse.UserDeviceMap.Any())
            {
                logger.LogWarning("No devices found for enrolled students in ClassSection {ClassSectionId}.",
                    message.ClassSectionId);
                return;
            }

            var deviceIds = studentDevicesResponse.UserDeviceMap.Values.ToList();
            var updatedScheduleCount = 0;

            // Update whitelist cho từng schedule
            foreach (var schedule in schedulesResponse.Schedules)
                try
                {
                    var existingWhitelist = await scheduleWhitelistRepository.GetByScheduleIdAsync(
                        schedule.ScheduleId, consumeContext.CancellationToken);

                    if (existingWhitelist != null)
                    {
                        // Whitelist đã tồn tại, thêm device mới vào
                        var whitelistedDeviceIds = new HashSet<Guid>(existingWhitelist.WhitelistedDeviceIds);
                        var addedDevicesCount = 0;

                        foreach (var deviceId in deviceIds)
                            if (whitelistedDeviceIds.Add(deviceId))
                                addedDevicesCount++;

                        if (addedDevicesCount > 0)
                        {
                            existingWhitelist.UpdateWhitelist(whitelistedDeviceIds.ToList());
                            await scheduleWhitelistRepository.UpdateAsync(existingWhitelist,
                                consumeContext.CancellationToken);
                            updatedScheduleCount++;

                            logger.LogInformation(
                                "Added {AddedCount} student devices to existing whitelist for Schedule {ScheduleId}.",
                                addedDevicesCount, schedule);
                        }
                        else
                        {
                            logger.LogInformation(
                                "All student devices already exist in whitelist for Schedule {ScheduleId}.",
                                schedule);
                        }
                    }
                    else
                    {
                        // Whitelist chưa tồn tại, tạo mới với student devices
                        var newWhitelist = ScheduleWhitelist.Create(schedule.ScheduleId, deviceIds);
                        await scheduleWhitelistRepository.AddAsync(newWhitelist, consumeContext.CancellationToken);
                        updatedScheduleCount++;

                        logger.LogInformation(
                            "Created new whitelist for Schedule {ScheduleId} with {DeviceCount} student devices.",
                            schedule, deviceIds.Count);
                    }
                }
                catch (Exception ex)
                {
                    logger.LogError(ex,
                        "Error updating whitelist for Schedule {ScheduleId} during student enrollment.",
                        schedule);
                }

            logger.LogInformation(
                "Successfully updated {UpdatedCount} schedule whitelists for {StudentCount} enrolled students in ClassSection {ClassSectionId}.",
                updatedScheduleCount, studentIds.Count, message.ClassSectionId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "MassTransit Consumer: Error processing student enrollment whitelist update for ClassSection {ClassSectionId}.",
                message.ClassSectionId);
            throw;
        }
    }
}