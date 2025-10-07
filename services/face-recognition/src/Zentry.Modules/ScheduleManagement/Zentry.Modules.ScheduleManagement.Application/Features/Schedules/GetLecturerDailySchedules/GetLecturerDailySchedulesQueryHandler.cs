using MediatR;
using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.Modules.ScheduleManagement.Application.Helpers;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Attendance;
using Zentry.SharedKernel.Contracts.Attendance;

// Đảm bảo đã thêm

namespace Zentry.Modules.ScheduleManagement.Application.Features.Schedules.GetLecturerDailySchedules;

public class GetLecturerDailySchedulesQueryHandler(
    IScheduleRepository scheduleRepository,
    IMediator mediator
) : IQueryHandler<GetLecturerDailySchedulesQuery, List<LecturerDailyClassDto>>
{
    public async Task<List<LecturerDailyClassDto>> Handle(GetLecturerDailySchedulesQuery request,
        CancellationToken cancellationToken)
    {
        var dayOfWeek = request.Date.DayOfWeek.ToWeekDayEnum();

        var schedules = await scheduleRepository.GetLecturerSchedulesForDateAsync(
            request.LecturerId,
            request.Date,
            dayOfWeek,
            cancellationToken
        );

        var result = new List<LecturerDailyClassDto>();

        foreach (var scheduleProjection in schedules)
        {
            var requestDateOnly = DateOnly.FromDateTime(request.Date);

            var currentSessionInfo = await mediator.Send(
                new GetSessionByScheduleIdAndDateIntegrationQuery(scheduleProjection.ScheduleId, requestDateOnly),
                cancellationToken);

            var sessionStatus = currentSessionInfo?.Status ?? SessionStatus.Pending.ToString();
            var sessionId = currentSessionInfo?.SessionId;

            result.Add(new LecturerDailyClassDto
            {
                ScheduleId = scheduleProjection.ScheduleId,
                ClassSectionId = scheduleProjection.ClassSectionId,
                CourseCode = scheduleProjection.CourseCode,
                CourseName = scheduleProjection.CourseName,
                SectionCode = scheduleProjection.SectionCode,
                Weekday = scheduleProjection.WeekDay.ToString(),
                StartTime = scheduleProjection.StartTime,
                EndTime = scheduleProjection.EndTime,
                RoomName = scheduleProjection.RoomName,
                Building = scheduleProjection.Building,
                SessionStatus = sessionStatus,
                SessionId = sessionId
            });
        }

        return result.OrderBy(s => s.StartTime).ToList();
    }
}