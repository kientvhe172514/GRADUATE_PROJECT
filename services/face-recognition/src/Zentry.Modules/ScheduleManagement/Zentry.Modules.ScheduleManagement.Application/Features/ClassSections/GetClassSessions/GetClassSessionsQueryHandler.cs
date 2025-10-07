using MediatR;
using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Attendance;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ScheduleManagement.Application.Features.ClassSections.GetClassSessions;

public class GetClassSessionsQueryHandler(
    IClassSectionRepository classSectionRepository,
    IMediator mediator
) : IQueryHandler<GetClassSessionsQuery, GetClassSessionsResponse>
{
    public async Task<GetClassSessionsResponse> Handle(GetClassSessionsQuery request,
        CancellationToken cancellationToken)
    {
        var classSection = await classSectionRepository.GetByIdAsync(request.ClassId, cancellationToken);
        if (classSection is null) throw new ResourceNotFoundException("Class section", request.ClassId);

        var scheduleIds = classSection.Schedules.Select(s => s.Id).ToList();
        var allSessions =
            await mediator.Send(new GetSessionsByScheduleIdsIntegrationQuery(scheduleIds), cancellationToken);

        var sessionsResponse = new List<SessionDetailDto>();
        var totalStudents = classSection.Enrollments.Count;

        // Tạo một Dictionary để tra cứu Schedule nhanh chóng
        var schedulesDict = classSection.Schedules.ToDictionary(s => s.Id, s => s);

        foreach (var sessionDto in allSessions.Data)
        {
            var attendedCount = sessionDto.AttendanceRecords.Count(ar => ar.Status == "Present");
            var attendanceRate = totalStudents > 0 ? (double)attendedCount / totalStudents * 100 : 0;

            // Lấy thông tin phòng học từ Schedule tương ứng
            var roomInfo = "N/A";
            if (schedulesDict.TryGetValue(sessionDto.ScheduleId, out var correspondingSchedule) &&
                correspondingSchedule?.Room != null)
                roomInfo = $"{correspondingSchedule.Room.RoomName} ({correspondingSchedule.Room.Building})";

            sessionsResponse.Add(new SessionDetailDto
            {
                SessionId = sessionDto.SessionId,
                SessionNumber = sessionDto.SessionNumber,
                SessionName = $"Session {sessionDto.SessionNumber}",
                SessionDate = sessionDto.SessionDate,
                SessionTime = sessionDto.SessionTime,
                EndTime = sessionDto.EndTime,
                RoomInfo = roomInfo,
                AttendedCount = attendedCount,
                TotalStudents = totalStudents,
                AttendanceRate = Math.Round(attendanceRate, 1),
                Status = sessionDto.Status
            });
        }

        return new GetClassSessionsResponse { Data = sessionsResponse };
    }
}