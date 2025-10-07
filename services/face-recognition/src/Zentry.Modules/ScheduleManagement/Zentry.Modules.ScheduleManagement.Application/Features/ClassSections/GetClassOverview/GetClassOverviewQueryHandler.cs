using MediatR;
using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.Modules.ScheduleManagement.Application.Services;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.User;
using Zentry.SharedKernel.Contracts.Attendance;
using Zentry.SharedKernel.Contracts.User;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ScheduleManagement.Application.Features.ClassSections.GetClassOverview;

public class GetClassOverviewQueryHandler(
    IClassSectionRepository classSectionRepository,
    IMediator mediator,
    IAttendanceCalculationService attendanceCalculationService
) : IQueryHandler<GetClassOverviewQuery, GetClassOverviewResponse>
{
    public async Task<GetClassOverviewResponse> Handle(GetClassOverviewQuery request,
        CancellationToken cancellationToken)
    {
        var classSection = await classSectionRepository.GetByIdAsync(request.ClassId, cancellationToken);
        if (classSection is null) throw new NotFoundException($"Class section with ID {request.ClassId} not found.");

        GetUserByIdAndRoleIntegrationResponse? lecturer = null;
        if (classSection.LecturerId.HasValue)
            lecturer = await mediator.Send(
                new GetUserByIdAndRoleIntegrationQuery(
                    (Guid)classSection.LecturerId, Role.Lecturer), cancellationToken);

        var scheduleIds = classSection.Schedules.Select(s => s.Id).ToList();
        var overviewData =
            await mediator.Send(new GetLecturerClassOverviewIntegrationQuery(scheduleIds), cancellationToken);

        var enrolledStudentsCount = classSection.Enrollments.Count;
        var totalSessions = overviewData.Sessions.Count;
        var completedSessionsCount = overviewData.Sessions.Count(s => s.Status == "completed");
        var attendanceRate = attendanceCalculationService.CalculateAttendanceRate(
            overviewData.Sessions,
            overviewData.AttendanceRecords,
            enrolledStudentsCount);

        var roomInfos = classSection.Schedules
            .Where(s => s.Room != null)
            .Select(s => $"{s.Room!.RoomName} ({s.Room.Building})")
            .Distinct()
            .ToList();

        var responseDto = new ClassOverviewDto
        {
            ClassId = classSection.Id,
            CourseName = classSection.Course?.Name ?? string.Empty,
            CourseCode = classSection.Course?.Code ?? string.Empty,
            SectionCode = classSection.SectionCode,
            ClassName = $"{classSection.Course?.Name} - {classSection.SectionCode}",
            EnrolledStudents = enrolledStudentsCount,
            CompletedSessions = completedSessionsCount,
            TotalSessions = totalSessions,
            AttendanceRate = attendanceRate,
            LecturerId = classSection.LecturerId,
            LecturerName = lecturer?.FullName ?? "Unassigned lecturer",
            RoomInfos = roomInfos,
            SemesterInfo = classSection.Semester.ToString()
        };

        return new GetClassOverviewResponse { Data = responseDto };
    }
}