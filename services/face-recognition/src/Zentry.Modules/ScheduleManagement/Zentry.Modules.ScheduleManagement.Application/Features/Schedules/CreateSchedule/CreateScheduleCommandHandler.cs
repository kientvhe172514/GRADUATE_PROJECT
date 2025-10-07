using MassTransit;
using Microsoft.Extensions.Logging;
using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.Modules.ScheduleManagement.Domain.Entities;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Events;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Schedules.CreateSchedule;

public class CreateScheduleCommandHandler(
    IScheduleRepository scheduleRepository,
    IClassSectionRepository classSectionRepository,
    IRoomRepository roomRepository,
    IPublishEndpoint publishEndpoint,
    ILogger<CreateScheduleCommandHandler> logger)
    : ICommandHandler<CreateScheduleCommand, CreatedScheduleResponse>
{
    public async Task<CreatedScheduleResponse> Handle(CreateScheduleCommand command,
        CancellationToken cancellationToken)
    {
        if (!command.IsValidTimeRange())
            throw new BusinessRuleException("INVALID_TIME_RANGE", "Thời gian bắt đầu phải trước thời gian kết thúc.");

        var classSection = await classSectionRepository.GetByIdAsync(command.ClassSectionId, cancellationToken);
        if (classSection is null)
            throw new ResourceNotFoundException("ClassSection", $"ID '{command.ClassSectionId}' not found.");

        var room = await roomRepository.GetByIdAsync(command.RoomId, cancellationToken);
        if (room is null)
            throw new ResourceNotFoundException("Room", $"ID '{command.RoomId}' not found.");

        if (!await scheduleRepository.IsRoomAvailableAsync(command.RoomId, command.WeekDay, command.StartTime,
                command.EndTime, command.StartDate, command.EndDate, cancellationToken))
            throw new BusinessRuleException("ROOM_BOOKED",
                $"Phòng đã được đặt vào {command.WeekDay} từ {command.StartTime} đến {command.EndTime} trong khoảng thời gian này.");
        var schedule = Schedule.Create(
            classSection.Id,
            command.RoomId,
            command.StartDate,
            command.EndDate,
            command.StartTime,
            command.EndTime,
            command.WeekDay
        );

        await scheduleRepository.AddAsync(schedule, cancellationToken);
        await scheduleRepository.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Schedule {ScheduleId} created successfully. Publishing event.", schedule.Id);
        var lecturerId = classSection.LecturerId;
        var scheduleCreatedEvent = new ScheduleCreatedMessage(
            schedule.Id,
            schedule.ClassSectionId,
            lecturerId,
            schedule.WeekDay.ToString(),
            schedule.StartTime,
            schedule.EndTime,
            schedule.StartDate,
            schedule.EndDate,
            classSection.CourseId
        );

        await publishEndpoint.Publish(scheduleCreatedEvent, cancellationToken);
        logger.LogInformation("ScheduleCreatedMessage published for ScheduleId: {ScheduleId}.", schedule.Id);
        logger.LogInformation("Published GenerateScheduleWhitelistMessage for ScheduleId: {ScheduleId}.",
            schedule.Id);
        return new CreatedScheduleResponse
        {
            Id = schedule.Id,
            ClassSectionId = schedule.ClassSectionId,
            RoomId = schedule.RoomId,
            StartTime = schedule.StartTime,
            EndTime = schedule.EndTime,
            WeekDay = schedule.WeekDay.ToString(),
            StartDate = schedule.StartDate,
            EndDate = schedule.EndDate,
            CreatedAt = schedule.CreatedAt
        };
    }
}