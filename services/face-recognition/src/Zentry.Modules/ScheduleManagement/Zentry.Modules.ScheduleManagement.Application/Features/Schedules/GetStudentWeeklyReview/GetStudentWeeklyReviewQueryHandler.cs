using MediatR;
using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Attendance;
using Zentry.SharedKernel.Extensions;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Schedules.GetStudentWeeklyReview;

public class GetStudentWeeklyReviewQueryHandler(
    IEnrollmentRepository enrollmentRepository,
    IClassSectionRepository classSectionRepository,
    IMediator mediator
) : IQueryHandler<GetStudentWeeklyReviewQuery, WeeklyReviewDto>
{
    public async Task<WeeklyReviewDto> Handle(GetStudentWeeklyReviewQuery request,
        CancellationToken cancellationToken)
    {
        var nowVietnam = DateTime.UtcNow.ToVietnamLocalTime();
        var startOfWeekVietnam = nowVietnam.StartOfWeek(DayOfWeek.Monday);
        var endOfWeekVietnam = startOfWeekVietnam.AddDays(6);
        var endOfWeekWithMaxTime = endOfWeekVietnam.Add(TimeOnly.MaxValue.ToTimeSpan());

        var startOfWeekUtc = startOfWeekVietnam.ToUtcFromVietnamLocalTime();
        var endOfWeekUtc = endOfWeekWithMaxTime.ToUtcFromVietnamLocalTime();

        var weeklyReview = new WeeklyReviewDto
        {
            WeekStart = startOfWeekVietnam.ToDateOnly(),
            WeekEnd = endOfWeekVietnam.ToDateOnly()
        };

        // 1. Lấy danh sách các lớp học của sinh viên
        var enrollments =
            await enrollmentRepository.GetActiveEnrollmentsByStudentIdAsync(request.StudentId, cancellationToken);
        var classSectionIds = enrollments.Select(e => e.ClassSectionId).ToList();

        // 2. Lấy thông tin chi tiết các lớp học này
        var classSections =
            await classSectionRepository.GetClassSectionsDetailsByIdsAsync(classSectionIds, cancellationToken);

        var allScheduleIds = classSections.SelectMany(cs => cs.Schedules.Select(s => s.Id)).ToList();

        // 3. Lấy tất cả sessions và attendance records trong tuần này từ module Attendance
        var weeklyOverviewResponse = await mediator.Send(
            new GetStudentWeeklyOverviewIntegrationQuery(request.StudentId, allScheduleIds, startOfWeekUtc,
                endOfWeekUtc),
            cancellationToken);

        // 4. Xử lý từng lớp học để tính toán thống kê
        foreach (var cs in classSections)
        {
            var classScheduleIds = cs.Schedules.Select(s => s.Id).ToList();

            var sessionsInWeek = weeklyOverviewResponse.Sessions
                .Where(s => classScheduleIds.Contains(s.ScheduleId))
                .ToList();

            var totalSessionsInWeek = sessionsInWeek.Count;
            var attendedSessions = weeklyOverviewResponse.AttendanceRecords
                .Count(ar => sessionsInWeek.Any(s => s.Id == ar.SessionId) && ar.Status == "attended");

            var attendancePercentage = totalSessionsInWeek > 0
                ? (double)attendedSessions / totalSessionsInWeek * 100
                : 0.0;

            weeklyReview.Courses.Add(new WeeklyReviewCourseDto
            {
                CourseCode = cs.Course?.Code ?? string.Empty,
                CourseName = cs.Course?.Name ?? string.Empty,
                SectionCode = cs.SectionCode,
                TotalSessionsInWeek = totalSessionsInWeek,
                AttendedSessions = attendedSessions,
                AttendancePercentage = Math.Round(attendancePercentage, 2)
            });
        }

        return weeklyReview;
    }
}