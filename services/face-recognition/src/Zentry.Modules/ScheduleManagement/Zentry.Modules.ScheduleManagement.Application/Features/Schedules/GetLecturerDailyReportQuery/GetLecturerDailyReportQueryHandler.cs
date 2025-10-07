using MediatR;
using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.Modules.ScheduleManagement.Application.Helpers;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.User;
using Zentry.SharedKernel.Contracts.Attendance;
using Zentry.SharedKernel.Contracts.Schedule;
using Zentry.SharedKernel.Contracts.User;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Schedules.GetLecturerDailyReportQuery;

public class GetLecturerDailyReportQueryHandler(
    IScheduleRepository scheduleRepository,
    IEnrollmentRepository enrollmentRepository,
    IMediator mediator)
    : IQueryHandler<GetLecturerDailyReportQuery, List<LecturerDailyReportDto>>
{
    public async Task<List<LecturerDailyReportDto>> Handle(
        GetLecturerDailyReportQuery request,
        CancellationToken cancellationToken)
    {
        var getUserQuery = new GetUserByIdAndRoleIntegrationQuery(request.LecturerId, Role.Lecturer);
        var lecturerInfo = await mediator.Send(getUserQuery, cancellationToken);
        var lecturerName = lecturerInfo?.FullName ?? "N/A";

        var dayOfWeek = request.Date.DayOfWeek.ToWeekDayEnum();
        var reportDateOnly = DateOnly.FromDateTime(request.Date); // Dùng DateOnly cho việc so sánh ngày

        // Lấy các lịch trình của giảng viên cho ngày đã cho, sử dụng phương thức projection mới
        var schedules = await scheduleRepository.GetLecturerReportSchedulesForDateAsync(
            request.LecturerId,
            request.Date, // Vẫn truyền DateTime, nhưng nội bộ repository sẽ dùng DateOnly
            dayOfWeek,
            cancellationToken);

        // --- BATCH QUERY CHO SESSIONS VÀ ATTENDANCE SUMMARY ---
        // Thu thập tất cả ScheduleId và DateOnly để query sessions theo lô
        var sessionLookups = schedules.Select(s => new ScheduleDateLookup(s.ScheduleId, reportDateOnly)).ToList();
        var allSessionsForDay = new List<GetSessionsByScheduleIdAndDateIntegrationResponse>();

        if (sessionLookups.Any())
        {
            // Lấy tất cả Sessions liên quan trong một lần
            var distinctSessionLookups = sessionLookups
                .GroupBy(x => new { x.ScheduleId, x.Date })
                .Select(g => g.First())
                .ToList();

            allSessionsForDay = await mediator.Send(
                new GetSessionsByScheduleIdsAndDatesIntegrationQuery(distinctSessionLookups),
                cancellationToken
            );
        }

        // Tạo Dictionary để tìm SessionId nhanh chóng
        var sessionDict = allSessionsForDay
            .ToDictionary(s => s.ScheduleId, s => s.SessionId);

        // Thu thập tất cả ClassSectionId để query tổng số sinh viên đăng ký theo lô
        var classSectionIds = schedules.Select(s => s.ClassSectionId).Distinct().ToList();
        var allTotalStudentsCounts = new Dictionary<Guid, int>();

        if (classSectionIds.Any())
            // Giả định có một Batch Query hoặc một phương thức trong IEnrollmentRepository
            // để lấy CountActiveStudentsByClassSectionIdsAsync
            // Nếu chưa có, bạn sẽ cần tạo một integration query/handler mới cho nó.
            // Hiện tại, tôi sẽ giả định rằng CountActiveStudentsByClassSectionIdIntegrationQuery có thể được gọi nhiều lần.
            // Để tối ưu, bạn nên viết một batch query tương tự như sessions.
            // (Hiện tại, tôi sẽ giữ nguyên vòng lặp nếu không có batch query cho Enrollment)
            foreach (var classSectionId in classSectionIds)
            {
                var totalStudentsCountResponse = await mediator.Send(
                    new CountActiveStudentsByClassSectionIdIntegrationQuery(classSectionId),
                    cancellationToken);
                allTotalStudentsCounts[classSectionId] = totalStudentsCountResponse.TotalStudents;
            }

        // --- Batch Query cho AttendanceSummary nếu có thể ---
        // Điều này phức tạp hơn vì GetAttendanceSummaryIntegrationQuery cần SessionId và ClassSectionId
        // cùng với Date. Có thể bạn cần một integration query mới cho batch summary.
        // Để đơn giản hóa, tôi sẽ giữ nguyên gọi mediator.Send bên trong vòng lặp cho GetAttendanceSummaryIntegrationQuery
        // vì nó đã được truyền SessionId cụ thể.

        var result = new List<LecturerDailyReportDto>();

        foreach (var scheduleProjection in schedules) // Sử dụng DTO mới
        {
            // Lấy SessionId từ dictionary
            if (!sessionDict.TryGetValue(scheduleProjection.ScheduleId, out var targetSessionId) ||
                targetSessionId == Guid.Empty)
                continue; // Bỏ qua nếu không tìm thấy session cho schedule này trong ngày

            // Lấy tổng số sinh viên đăng ký từ dictionary
            if (!allTotalStudentsCounts.TryGetValue(scheduleProjection.ClassSectionId, out var totalStudents))
                totalStudents = 0; // Mặc định là 0 nếu không tìm thấy

            // Lấy thông tin điểm danh từ module Attendance
            var attendanceSummary = await mediator.Send(
                new GetAttendanceSummaryIntegrationQuery(targetSessionId, scheduleProjection.ClassSectionId,
                    request.Date),
                cancellationToken);

            var attendedCount = attendanceSummary.PresentCount;
            var total = totalStudents > 0 ? totalStudents : 1; // Tránh chia cho 0

            result.Add(new LecturerDailyReportDto
            {
                LecturerId = request.LecturerId,
                ClassSectionId = scheduleProjection.ClassSectionId,
                CourseId = scheduleProjection.CourseId,
                ScheduleId = scheduleProjection.ScheduleId,
                RoomId = scheduleProjection.RoomId,
                // SessionId = targetSessionId, // Tùy chọn nếu cần hiển thị SessionId
                ReportDate = reportDateOnly,

                LecturerName = lecturerName,
                CourseCode = scheduleProjection.CourseCode,
                CourseName = scheduleProjection.CourseName,
                SectionCode = scheduleProjection.SectionCode,
                RoomInfo = $"{scheduleProjection.RoomName} - {scheduleProjection.Building}",
                TimeSlot =
                    $"{scheduleProjection.StartTime.ToShortTimeString()} - {scheduleProjection.EndTime.ToShortTimeString()}",
                TotalStudents = totalStudents,
                AttendedStudents = attendedCount,
                PresentStudents = attendanceSummary.PresentCount,
                AbsentStudents = attendanceSummary.AbsentCount,
                AttendanceRate = totalStudents > 0 ? $"{Math.Round(attendedCount * 100.0 / total, 1)}%" : "0%",
                OnTimeRate = totalStudents > 0
                    ? $"{Math.Round(attendanceSummary.PresentCount * 100.0 / total, 1)}%"
                    : "0%"
            });
        }

        return result.OrderBy(r => r.TimeSlot).ToList();
    }
}