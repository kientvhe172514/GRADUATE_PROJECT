using MediatR;
using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.Modules.ScheduleManagement.Application.Helpers;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Attendance;
using Zentry.SharedKernel.Contracts.User;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Schedules.GetStudentDailySchedules;

public class GetStudentDailySchedulesQueryHandler(
    IEnrollmentRepository enrollmentRepository,
    IScheduleRepository scheduleRepository,
    IMediator mediator
) : IQueryHandler<GetStudentDailySchedulesQuery, List<StudentDailyClassDto>>
{
    public async Task<List<StudentDailyClassDto>> Handle(
        GetStudentDailySchedulesQuery request,
        CancellationToken cancellationToken)
    {
        var dayOfWeek = request.Date.DayOfWeek.ToWeekDayEnum();
        var result = new List<StudentDailyClassDto>();

        // 1. Lấy tất cả các lớp học mà sinh viên đã đăng ký
        var enrollmentProjections = await enrollmentRepository
            .GetEnrollmentsWithClassSectionProjectionsByStudentIdAsync(request.StudentId, cancellationToken);

        var classSectionIds = enrollmentProjections.Select(e => e.ClassSectionId).ToList();

        // 2. Lấy tất cả các schedule của các lớp đó trong ngày hôm nay
        var schedulesForDay = await scheduleRepository.GetSchedulesByClassSectionIdsAndDateAsync(
            classSectionIds, request.Date, dayOfWeek, cancellationToken);

        var scheduleIds = schedulesForDay.Select(s => s.ScheduleId).ToList();

        // 3. Lấy thông tin lecturer của các class section liên quan
        var lecturerIds = enrollmentProjections
            .Where(e => e.LecturerId != null)
            .Select(e => e.LecturerId).Distinct()
            .Select(e => (Guid)e!).ToList();
        var lecturerInfos = await mediator.Send(new GetUsersByIdsIntegrationQuery(lecturerIds), cancellationToken);
        var lecturerDictionary = lecturerInfos.Users.ToDictionary(u => u.Id, u => u.FullName);

        // 4. Lấy thông tin sessions - SỬ DỤNG MEDIATOR
        var sessionsResponse = await mediator.Send(
            new GetSessionsByScheduleIdsAndDateIntegrationQuery(scheduleIds, request.Date),
            cancellationToken);
        var sessionInfos = sessionsResponse.SessionsByScheduleId;

        // 5. Kết hợp dữ liệu và ánh xạ vào DTO
        var enrollmentProjectionDictionary = enrollmentProjections.ToDictionary(e => e.ClassSectionId);

        foreach (var scheduleProjection in schedulesForDay)
        {
            if (!enrollmentProjectionDictionary.TryGetValue(scheduleProjection.ClassSectionId,
                    out var enrollmentProjection))
                continue;

            var currentSessionInfo = sessionInfos.GetValueOrDefault(scheduleProjection.ScheduleId);
            var sessionStatus = currentSessionInfo?.Status ?? "Pending";
            var sessionId = currentSessionInfo?.SessionId;

            result.Add(new StudentDailyClassDto
            {
                ScheduleId = scheduleProjection.ScheduleId,
                ClassSectionId = scheduleProjection.ClassSectionId,
                CourseId = enrollmentProjection.CourseId,
                CourseCode = enrollmentProjection.CourseCode,
                CourseName = enrollmentProjection.CourseName,
                SectionCode = enrollmentProjection.SectionCode,
                LecturerId = enrollmentProjection.LecturerId,
                LecturerName = enrollmentProjection.LecturerId != null
                    ? lecturerDictionary!.GetValueOrDefault<Guid, string>((Guid)enrollmentProjection.LecturerId, "N/A")
                    : null,
                RoomId = scheduleProjection.RoomId,
                RoomName = scheduleProjection.RoomName,
                Building = scheduleProjection.Building,
                StartTime = scheduleProjection.StartTime,
                EndTime = scheduleProjection.EndTime,
                Weekday = dayOfWeek.ToString(),
                DateInfo = request.Date,
                SessionId = sessionId,
                SessionStatus = sessionStatus
            });
        }

        return result.OrderBy(s => s.StartTime).ToList();
    }
}