using MassTransit;
using Microsoft.Extensions.Logging;
using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.Modules.ScheduleManagement.Domain.Entities;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Schedule;
using Zentry.SharedKernel.Contracts.Events;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Schedules.ImportSchedules;

public class ImportSchedulesCommandHandler(
    IScheduleRepository scheduleRepository,
    IClassSectionRepository classSectionRepository,
    IRoomRepository roomRepository,
    IPublishEndpoint publishEndpoint,
    ILogger<ImportSchedulesCommandHandler> logger)
    : ICommandHandler<ImportSchedulesCommand, ImportSchedulesResponse>
{
    public async Task<ImportSchedulesResponse> Handle(ImportSchedulesCommand command,
        CancellationToken cancellationToken)
    {
        var response = new ImportSchedulesResponse();
        var validSchedules = new List<ScheduleImportDto>();

        // 1. Xác thực và lọc dữ liệu đầu vào
        var validator = new ImportScheduleDtoValidator();
        foreach (var scheduleDto in command.SchedulesToImport)
        {
            var validationResult = await validator.ValidateAsync(scheduleDto, cancellationToken);
            if (validationResult.IsValid)
            {
                validSchedules.Add(scheduleDto);
            }
            else
            {
                var errorMessage = string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage));
                response.Errors.Add(new ImportError
                {
                    RowIndex = scheduleDto.RowIndex,
                    Identifier = $"{scheduleDto.SectionCode} - {scheduleDto.RoomName}",
                    Message = errorMessage
                });
            }
        }

        if (!validSchedules.Any())
        {
            response.FailedCount = command.SchedulesToImport.Count;
            return response;
        }

        // 2. Lấy ID của ClassSection và Room dựa trên tên unique
        var sectionCodes = validSchedules.Select(s => s.SectionCode).Distinct().ToList();
        var roomNames = validSchedules.Select(s => s.RoomName).Distinct().ToList();

        var sections = (await classSectionRepository.GetBySectionCodesAsync(sectionCodes, cancellationToken))
            .ToDictionary(s => s.SectionCode, s => s.Id, StringComparer.OrdinalIgnoreCase);

        var rooms = (await roomRepository.GetByRoomNamesAsync(roomNames, cancellationToken))
            .ToDictionary(r => r.RoomName, r => r.Id, StringComparer.OrdinalIgnoreCase);

        var classSectionsWithCourses =
            (await classSectionRepository.GetBySectionCodesAsync(sectionCodes, cancellationToken))
            .ToDictionary(s => s.Id, s => s.CourseId);

        var finalSchedulesToProcess = new List<Schedule>();

        foreach (var scheduleDto in validSchedules)
            try
            {
                // Kiểm tra sự tồn tại của ClassSection và Room
                if (!sections.TryGetValue(scheduleDto.SectionCode, out var classSectionId))
                {
                    response.Errors.Add(new ImportError
                    {
                        RowIndex = scheduleDto.RowIndex,
                        Identifier = scheduleDto.SectionCode,
                        Message = $"Mã lớp '{scheduleDto.SectionCode}' không tồn tại."
                    });
                    continue;
                }

                if (!rooms.TryGetValue(scheduleDto.RoomName, out var roomId))
                {
                    response.Errors.Add(new ImportError
                    {
                        RowIndex = scheduleDto.RowIndex,
                        Identifier = scheduleDto.RoomName,
                        Message = $"Tên phòng '{scheduleDto.RoomName}' không tồn tại."
                    });
                    continue;
                }

                // Chuyển đổi dữ liệu chuỗi sang kiểu dữ liệu phù hợp
                var startDate = DateOnly.Parse(scheduleDto.StartDate);
                var endDate = DateOnly.Parse(scheduleDto.EndDate);
                var startTime = TimeOnly.Parse(scheduleDto.StartTime);
                var endTime = TimeOnly.Parse(scheduleDto.EndTime);
                var weekDay = WeekDayEnum.FromName(scheduleDto.WeekDay);

                // 3. Kiểm tra tính khả dụng của phòng trước khi tạo schedule
                if (!await scheduleRepository.IsRoomAvailableAsync(roomId, weekDay, startTime, endTime, startDate,
                        endDate, cancellationToken))
                {
                    response.Errors.Add(new ImportError
                    {
                        RowIndex = scheduleDto.RowIndex,
                        Identifier = $"{scheduleDto.SectionCode} - {scheduleDto.RoomName}",
                        Message = $"Phòng '{scheduleDto.RoomName}' đã được đặt trong khoảng thời gian này."
                    });
                    continue;
                }

                // 4. Tạo thực thể Schedule và thêm vào danh sách
                var schedule = Schedule.Create(
                    classSectionId,
                    roomId,
                    startDate,
                    endDate,
                    startTime,
                    endTime,
                    weekDay
                );
                finalSchedulesToProcess.Add(schedule);
            }
            catch (Exception ex)
            {
                response.Errors.Add(new ImportError
                {
                    RowIndex = scheduleDto.RowIndex,
                    Identifier = $"{scheduleDto.SectionCode} - {scheduleDto.RoomName}",
                    Message = $"Lỗi khi chuẩn bị dữ liệu: {ex.Message}"
                });
            }

        // 5. Lưu toàn bộ schedules hợp lệ vào CSDL trong một lần
        try
        {
            await scheduleRepository.AddRangeAsync(finalSchedulesToProcess, cancellationToken);
            await scheduleRepository.SaveChangesAsync(cancellationToken);
            response.ImportedCount = finalSchedulesToProcess.Count;
            response.FailedCount = command.SchedulesToImport.Count - response.ImportedCount;

            foreach (var schedule in finalSchedulesToProcess)
            {
                var scheduleCreatedEvent = new ScheduleCreatedMessage(
                    schedule.Id,
                    schedule.ClassSectionId,
                    null,
                    schedule.WeekDay.ToString(),
                    schedule.StartTime,
                    schedule.EndTime,
                    schedule.StartDate,
                    schedule.EndDate,
                    classSectionsWithCourses[schedule.ClassSectionId]
                );
                await publishEndpoint.Publish(scheduleCreatedEvent, cancellationToken);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to save imported schedules to database.");
            response.Errors.Add(new ImportError
            {
                RowIndex = 0,
                Identifier = string.Empty,
                Message = $"Lỗi khi lưu vào CSDL: {ex.Message}"
            });
            response.ImportedCount = 0;
            response.FailedCount = command.SchedulesToImport.Count;
        }

        return response;
    }
}