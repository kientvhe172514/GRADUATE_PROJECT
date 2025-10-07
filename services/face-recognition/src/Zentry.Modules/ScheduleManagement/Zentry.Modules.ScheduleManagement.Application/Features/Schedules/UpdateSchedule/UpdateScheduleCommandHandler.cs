using MassTransit;
using MediatR;
using Microsoft.Extensions.Logging;
using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Schedule;
using Zentry.SharedKernel.Contracts.Attendance;
using Zentry.SharedKernel.Contracts.Events;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Schedules.UpdateSchedule;

public class UpdateScheduleCommandHandler(
    IClassSectionRepository classSectionRepository,
    IScheduleRepository scheduleRepository,
    IRoomRepository roomRepository,
    IPublishEndpoint publishEndpoint,
    IMediator mediator,
    ILogger<UpdateScheduleCommandHandler> logger)
    : ICommandHandler<UpdateScheduleCommand, Unit>
{
    public async Task<Unit> Handle(UpdateScheduleCommand command, CancellationToken cancellationToken)
    {
        logger.LogInformation("Attempting to update schedule {ScheduleId}.", command.ScheduleId);

        var schedule = await scheduleRepository.GetByIdAsync(command.ScheduleId, cancellationToken);
        if (schedule is null) throw new ResourceNotFoundException("Schedule", $"ID '{command.ScheduleId}' not found.");

        var oldStartDate = schedule.StartDate;
        var oldEndDate = schedule.EndDate;
        var oldWeekDay = schedule.WeekDay;
        var oldStartTime = schedule.StartTime;
        var oldEndTime = schedule.EndTime;

        // Validation cho Room nếu có thay đổi
        if (command.RoomId.HasValue)
        {
            var room = await roomRepository.GetByIdAsync(command.RoomId.Value, cancellationToken);
            if (room is null) throw new ResourceNotFoundException("Room", $"ID '{command.RoomId.Value}' not found.");
        }

        var newWeekDay = command.WeekDay != null ? WeekDayEnum.FromName(command.WeekDay) : schedule.WeekDay;
        var newStartTime = command.StartTime ?? schedule.StartTime;
        var newEndTime = command.EndTime ?? schedule.EndTime;
        var newStartDate = command.StartDate ?? schedule.StartDate;
        var newEndDate = command.EndDate ?? schedule.EndDate;
        var newRoomId = command.RoomId ?? schedule.RoomId;

        // Kiểm tra room availability nếu có thay đổi về room, time, hoặc date
        if (newRoomId != schedule.RoomId || !Equals(newWeekDay, schedule.WeekDay) ||
            newStartTime != schedule.StartTime ||
            newEndTime != schedule.EndTime || newStartDate != schedule.StartDate || newEndDate != schedule.EndDate)
            if (!await scheduleRepository.IsRoomAvailableForUpdateAsync(newRoomId, newWeekDay, newStartTime, newEndTime,
                    newStartDate, newEndDate, schedule.Id, cancellationToken))
                throw new BusinessRuleException("ROOM_BOOKED",
                    $"Phòng đã được đặt vào {newWeekDay} từ {newStartTime} đến {newEndTime} trong khoảng thời gian này.");

        // Cập nhật schedule
        schedule.Update(
            command.RoomId,
            command.StartDate,
            command.EndDate,
            command.StartTime,
            command.EndTime,
            command.WeekDay != null ? WeekDayEnum.FromName(command.WeekDay) : null
        );

        await scheduleRepository.UpdateAsync(schedule, cancellationToken);
        logger.LogInformation("Schedule {ScheduleId} updated successfully.", schedule.Id);

        // Kiểm tra xem có cần recreate sessions hay chỉ update sessions
        var needsRecreation = oldEndDate != newEndDate || oldStartDate != newStartDate ||
                              oldWeekDay.ToString() != newWeekDay.ToString();

        if (needsRecreation)
        {
            // Trường hợp này chỉ xảy ra khi schedule chưa bắt đầu
            // (vì logic cũ đã kiểm tra schedule.StartDate <= DateOnly.FromDateTime(DateTime.UtcNow))
            if (schedule.StartDate <= DateOnly.FromDateTime(DateTime.UtcNow))
                throw new BusinessRuleException("CANNOT_RECREATE_STARTED_SCHEDULE",
                    "Không thể thay đổi ngày bắt đầu, kết thúc hoặc thứ của lịch học đã bắt đầu.");

            // Recreate sessions cho schedule chưa bắt đầu
            await mediator.Send(
                new DeleteSessionsByScheduleIdIntegrationCommand { ScheduleId = schedule.Id }, cancellationToken);

            var classSection = await classSectionRepository.GetByIdAsync(schedule.ClassSectionId, cancellationToken);

            var scheduleCreatedEvent = new ScheduleCreatedMessage(
                schedule.Id,
                schedule.ClassSectionId,
                classSection?.LecturerId,
                schedule.WeekDay.ToString(),
                schedule.StartTime,
                schedule.EndTime,
                schedule.StartDate,
                schedule.EndDate,
                classSection!.CourseId
            );
            await publishEndpoint.Publish(scheduleCreatedEvent, cancellationToken);

            logger.LogInformation("ScheduleCreatedMessage published for recreated ScheduleId: {ScheduleId}.",
                schedule.Id);
        }
        else if (oldStartTime != newStartTime || oldEndTime != newEndTime)
        {
            // Chỉ update time cho sessions, bao gồm cả schedule đang trong kỳ
            // Logic này sẽ chỉ update những session đang Pending
            var scheduleUpdatedEvent = new ScheduleUpdatedMessage(
                schedule.Id,
                newStartTime,
                newEndTime
            );
            await publishEndpoint.Publish(scheduleUpdatedEvent, cancellationToken);

            logger.LogInformation("ScheduleUpdatedMessage published for ScheduleId: {ScheduleId}.", schedule.Id);
        }
        else
        {
            // Trường hợp chỉ thay đổi room mà không thay đổi time
            logger.LogInformation(
                "Only room information updated for ScheduleId: {ScheduleId}, no session update needed.", schedule.Id);
        }

        return Unit.Value;
    }
}