using MediatR;
using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Attendance;
using Zentry.SharedKernel.Contracts.Schedule;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Schedules.GetScheduleDetail;

public class GetScheduleDetailQueryHandler(
    IScheduleRepository scheduleRepository,
    IMediator mediator
) : IQueryHandler<GetScheduleDetailQuery, ScheduleDetailDto>
{
    public async Task<ScheduleDetailDto> Handle(GetScheduleDetailQuery request, CancellationToken cancellationToken)
    {
        var scheduleDetails =
            await scheduleRepository.GetScheduleDetailsWithRelationsAsync(request.ScheduleId, cancellationToken);

        if (scheduleDetails == null)
            throw new NotFoundException("Schedule", $"Lịch học với ID '{request.ScheduleId}' không tìm thấy.");


        var totalStudentsCountResponse = await mediator.Send(
            new CountActiveStudentsByClassSectionIdIntegrationQuery(scheduleDetails.ClassSectionId),
            cancellationToken);

        // Bước 3: Lấy trạng thái Session của lịch học này cho ngày hôm nay từ Attendance Module
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var sessionStatusQuery = new GetSessionStatusIntegrationQuery
        {
            ScheduleId = request.ScheduleId,
            SessionDate = today
        };
        var sessionStatus = await mediator.Send(sessionStatusQuery, cancellationToken);

        // Bước 4: Ánh xạ dữ liệu vào DTO cuối cùng
        var duration = scheduleDetails.EndTime - scheduleDetails.StartTime;

        return new ScheduleDetailDto
        {
            ScheduleId = scheduleDetails.ScheduleId,
            StartDate = scheduleDetails.StartDate,
            EndDate = scheduleDetails.EndDate,
            StartTime = scheduleDetails.StartTime,
            EndTime = scheduleDetails.EndTime,
            WeekDay = scheduleDetails.WeekDay.ToString(),

            ClassSectionId = scheduleDetails.ClassSectionId,
            SectionCode = scheduleDetails.SectionCode,
            CourseName = scheduleDetails.CourseName,

            RoomId = scheduleDetails.RoomId,
            RoomName = scheduleDetails.RoomName,
            Building = scheduleDetails.Building,

            EnrolledStudentsCount = totalStudentsCountResponse.TotalStudents,
            DurationInMinutes = (int)duration.TotalMinutes,
            SessionStatus = sessionStatus?.Status
        };
    }
}