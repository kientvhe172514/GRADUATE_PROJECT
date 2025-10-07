using MediatR;
using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.Modules.ScheduleManagement.Application.Services;
using Zentry.Modules.ScheduleManagement.Domain.ValueObjects;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Attendance;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Courses.GetLecturerSemesterCourses;

public class GetLecturerSemesterCoursesQueryHandler(
    IClassSectionRepository classSectionRepository,
    IMediator mediator,
    IAttendanceCalculationService attendanceCalculationService
) : IQueryHandler<GetLecturerSemesterCoursesQuery, GetLecturerSemesterCoursesResponse>
{
    public async Task<GetLecturerSemesterCoursesResponse> Handle(GetLecturerSemesterCoursesQuery request,
        CancellationToken cancellationToken)
    {
        var semesterCourses = new List<SemesterCourseDto>();

        var classSections = await classSectionRepository.GetLecturerClassSectionsInSemesterAsync(
            request.LecturerId,
            Semester.Create(request.Semester),
            cancellationToken);

        var allScheduleIds = classSections.SelectMany(cs => cs.Schedules.Select(s => s.Id)).ToList();

        var overviewData = await mediator.Send(
            new GetLecturerClassOverviewIntegrationQuery(allScheduleIds),
            cancellationToken);

        foreach (var cs in classSections)
        {
            var classScheduleIds = cs.Schedules.Select(s => s.Id).ToList();

            var classSessions = overviewData.Sessions
                .Where(s => classScheduleIds.Contains(s.ScheduleId))
                .ToList();

            var classAttendanceRecords = overviewData.AttendanceRecords
                .Where(ar => classSessions.Any(s => s.Id == ar.SessionId))
                .ToList();

            var completedSessionsCount = classSessions
                .Count(s => s.Status == "completed");

            var attendanceRate = attendanceCalculationService.CalculateAttendanceRate(
                classSessions,
                classAttendanceRecords,
                cs.Enrollments.Count);

            semesterCourses.Add(new SemesterCourseDto
            {
                ClassId = cs.Id,
                CourseName = cs.Course?.Name ?? string.Empty,
                CourseCode = cs.Course?.Code ?? string.Empty,
                SectionCode = cs.SectionCode,
                ClassName = $"{cs.Course?.Name} - {cs.SectionCode}",
                EnrolledStudents = cs.Enrollments.Count,
                CompletedSessions = completedSessionsCount,
                TotalSessions = classSessions.Count,
                AttendanceRate = attendanceRate
            });
        }

        return new GetLecturerSemesterCoursesResponse
        {
            SemesterCourses = semesterCourses
        };
    }
}