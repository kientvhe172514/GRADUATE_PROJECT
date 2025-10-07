using MediatR;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.Modules.AttendanceManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Schedule;
using Zentry.SharedKernel.Extensions;

namespace Zentry.Modules.AttendanceManagement.Application.Features.GetStudentSessions;

public class GetStudentSessionsQueryHandler(
    ISessionRepository sessionRepository,
    IAttendanceRecordRepository attendanceRecordRepository,
    IMediator mediator) // Xóa IEnrollmentRepository
    : IQueryHandler<GetStudentSessionsQuery, GetStudentSessionsResponse>
{
    public async Task<GetStudentSessionsResponse> Handle(GetStudentSessionsQuery request,
        CancellationToken cancellationToken)
    {
        // 1. Lấy tất cả ClassSectionId mà sinh viên đã đăng ký thông qua Integration Query
        var enrollmentsResponse = await mediator.Send(
            new GetEnrollmentsByStudentIdIntegrationQuery(request.StudentId), // Sử dụng integration query
            cancellationToken);

        var classSectionIds = enrollmentsResponse.ClassSectionIds;

        if (classSectionIds.Count == 0) return new GetStudentSessionsResponse(new List<StudentSessionDto>());

        // 2. Lấy tất cả ScheduleId và thông tin phòng học từ ScheduleManagement
        var schedulesWithRooms = await mediator.Send(
            new GetSchedulesByClassSectionIdsIntegrationQuery(classSectionIds),
            cancellationToken);

        var scheduleIds = schedulesWithRooms.Schedules.Select(s => s.Id).ToList();

        if (scheduleIds.Count == 0) return new GetStudentSessionsResponse(new List<StudentSessionDto>());

        // 3. Lấy tất cả Sessions từ các ScheduleId
        var sessions = await sessionRepository.GetSessionsByScheduleIdsAsync(scheduleIds, cancellationToken);
        var sessionIds = sessions.Select(s => s.Id).ToList();

        // 4. Lấy tất cả AttendanceRecords của sinh viên cho các sessions này
        var attendanceRecords = await attendanceRecordRepository.GetAttendanceRecordsByStudentIdAndSessionIdsAsync(
            request.StudentId, sessionIds, cancellationToken);

        // 5. Tạo các map để dễ dàng tra cứu dữ liệu
        var scheduleToRoomMap = schedulesWithRooms.Schedules
            .ToDictionary(s => s.Id, s => s.RoomInfo);

        var attendanceStatusMap = attendanceRecords
            .ToDictionary(ar => ar.SessionId, ar => ar.Status.ToString());

        // 6. Xây dựng DTO
        var studentSessions = new List<StudentSessionDto>();
        foreach (var session in sessions.OrderBy(s => s.StartTime))
        {
            // Tìm Schedule tương ứng để lấy thông tin phòng
            if (!scheduleToRoomMap.TryGetValue(session.ScheduleId, out var roomInfo)) roomInfo = "N/A";

            // Tìm trạng thái điểm danh
            var attendanceStatus = attendanceStatusMap.GetValueOrDefault(session.Id, "Absent");

            // Xây dựng DTO
            studentSessions.Add(new StudentSessionDto
            {
                SessionId = session.Id,
                SessionNumber = session.SessionNumber,
                SessionName = $"Session {session.SessionNumber}",
                SessionDate = session.StartTime.ToUniversalTime().ToDateOnly(),
                StartTime = session.StartTime.ToUniversalTime().ToTimeOnly(),
                EndTime = session.EndTime.ToUniversalTime().ToTimeOnly(),
                RoomInfo = roomInfo,
                AttendanceStatus = attendanceStatus
            });
        }

        return new GetStudentSessionsResponse(studentSessions);
    }
}