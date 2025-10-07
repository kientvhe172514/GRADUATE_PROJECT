using MediatR;
using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Attendance;
using Zentry.SharedKernel.Contracts.Attendance;
using Zentry.SharedKernel.Contracts.User;
using Zentry.SharedKernel.Extensions;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Schedules.GetStudentNextSessions;

public class GetStudentNextSessionsQueryHandler(
    IEnrollmentRepository enrollmentRepository,
    IClassSectionRepository classSectionRepository,
    IMediator mediator)
    : IQueryHandler<GetStudentNextSessionsQuery, List<NextSessionDto>>
{
    public async Task<List<NextSessionDto>> Handle(GetStudentNextSessionsQuery request,
        CancellationToken cancellationToken)
    {
        var nextSessions = new List<NextSessionDto>();

        // 1. Lấy danh sách các lớp học mà sinh viên đã đăng ký
        var enrollments =
            await enrollmentRepository.GetActiveEnrollmentsByStudentIdAsync(request.StudentId, cancellationToken);
        var classSectionIds = enrollments.Select(e => e.ClassSectionId).ToList();

        // 2. Lấy thông tin về schedule từ các lớp học này
        var classSections =
            await classSectionRepository.GetClassSectionsDetailsByIdsAsync(classSectionIds, cancellationToken);
        var allScheduleIds = classSections.SelectMany(cs => cs.Schedules.Select(s => s.Id)).ToList();

        // 3. Sử dụng Integration Query để lấy các session sắp tới từ module Attendance
        var upcomingSessionsResponse = await mediator.Send(
            new GetUpcomingSessionsByScheduleIdsIntegrationQuery(allScheduleIds),
            cancellationToken);

        // 4. Lấy trạng thái điểm danh của sinh viên cho các session này
        var sessionIds = upcomingSessionsResponse.Sessions.Select(s => s.Id).ToList();
        var studentAttendanceStatusResponse = await mediator.Send(
            new GetStudentAttendanceStatusForSessionsIntegrationQuery(request.StudentId, sessionIds),
            cancellationToken);
        var studentAttendanceStatusMap = studentAttendanceStatusResponse.AttendanceStatus
            .ToDictionary(a => a.SessionId, a => a.Status);

        // 5. Lấy thông tin giảng viên
        var lecturerIds = classSections
            .Where(cs => cs.LecturerId.HasValue)
            .Select(cs => cs.LecturerId!.Value)
            .ToList();

        var lecturerNameMap = new Dictionary<Guid, string?>();
        if (lecturerIds.Count != 0)
        {
            var lecturersResponse =
                await mediator.Send(new GetUsersByIdsIntegrationQuery(lecturerIds), cancellationToken);
            lecturerNameMap = lecturersResponse.Users.ToDictionary(l => l.Id, l => l.FullName);
        }

        // 6. Xây dựng DTO
        foreach (var session in upcomingSessionsResponse.Sessions)
        {
            var correspondingClassSection = classSections
                .FirstOrDefault(cs => cs.Schedules.Any(s => s.Id == session.ScheduleId));

            if (correspondingClassSection is null) continue;

            var room = correspondingClassSection.Schedules
                .FirstOrDefault(s => s.Id == session.ScheduleId)?.Room;

            studentAttendanceStatusMap.TryGetValue(session.Id, out var attendanceStatus);

            var lecturerName = "Unassigned Lecturer ";
            if (correspondingClassSection.LecturerId.HasValue &&
                lecturerNameMap.TryGetValue(correspondingClassSection.LecturerId.Value, out var name))
                if (name != null)
                    lecturerName = name;

            nextSessions.Add(new NextSessionDto
            {
                ClassSectionId = correspondingClassSection.Id,
                SessionId = session.Id,
                ClassTitle = $"{correspondingClassSection.Course?.Name} - {correspondingClassSection.SectionCode}",
                CourseCode = correspondingClassSection.Course?.Code ?? string.Empty,
                SectionCode = correspondingClassSection.SectionCode,
                StartDate = session.StartTime.ToVietnamLocalTime().ToDateOnly(),
                StartTime = session.StartTime.ToVietnamLocalTime().ToTimeOnly(),
                EndDate = session.EndTime.ToVietnamLocalTime().ToDateOnly(),
                EndTime = session.EndTime.ToVietnamLocalTime().ToTimeOnly(),
                RoomInfo = $"{room?.RoomName} ({room?.Building})",
                LecturerName = lecturerName,
                AttendanceStatus = attendanceStatus ?? AttendanceStatus.Absent.ToString(),
                Status = session.Status
            });
        }

        return nextSessions.OrderBy(s => s.StartDate).ThenBy(s => s.StartTime).ToList();
    }
}