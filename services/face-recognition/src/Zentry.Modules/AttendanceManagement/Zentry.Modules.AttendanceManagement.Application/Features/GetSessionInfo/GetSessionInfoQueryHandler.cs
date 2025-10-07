using MediatR;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.Modules.AttendanceManagement.Application.Dtos;
using Zentry.Modules.AttendanceManagement.Application.Services.Interface;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Attendance;
using Zentry.SharedKernel.Contracts.Schedule;
using Zentry.SharedKernel.Exceptions;
using Zentry.SharedKernel.Extensions;

namespace Zentry.Modules.AttendanceManagement.Application.Features.GetSessionInfo;

public class GetSessionInfoQueryHandler(
    ISessionRepository sessionRepository,
    IMediator mediator,
    IAttendanceCalculationService attendanceCalculationService)
    : IQueryHandler<GetSessionInfoQuery, SessionInfoDto>
{
    public async Task<SessionInfoDto> Handle(GetSessionInfoQuery request, CancellationToken cancellationToken)
    {
        var session =
            await sessionRepository.GetSessionsWithAttendanceRecordsByIdAsync(request.SessionId, cancellationToken);

        if (session is null)
            throw new NotFoundException("Session", request.SessionId);

        var classSectionResponse = await mediator.Send(
            new GetClassSectionByScheduleIdIntegrationQuery(session.ScheduleId),
            cancellationToken);

        if (classSectionResponse == null || classSectionResponse.ClassSectionId == Guid.Empty)
            throw new NotFoundException("ClassSection", $"for ScheduleId {session.ScheduleId}.");

        var enrollmentsResponse = await mediator.Send(
            new GetEnrollmentsByClassSectionIdIntegrationQuery(classSectionResponse.ClassSectionId),
            cancellationToken);

        var roomInfoResponse = await mediator.Send(
            new GetRoomInfoByScheduleIdIntegrationQuery(session.ScheduleId),
            cancellationToken);

        var totalStudents = enrollmentsResponse.Enrollments.Count;
        var attendedCount = session.AttendanceRecords.Count(ar => Equals(ar.Status, AttendanceStatus.Present));

        var localStartTime = session.StartTime.ToVietnamLocalTime();

        return new SessionInfoDto
        {
            SessionId = session.Id,
            SessionNumber = session.SessionNumber,
            SessionName = $"Session {session.SessionNumber}",
            Status = session.Status.ToString(),
            SessionDate = DateOnly.FromDateTime(localStartTime),
            SessionTime = TimeOnly.FromDateTime(localStartTime),
            EndTime = TimeOnly.FromDateTime(session.EndTime.ToVietnamLocalTime()),
            RoomInfo = roomInfoResponse?.RoomInfo,
            AttendedCount = attendedCount,
            TotalStudents = totalStudents,
            ClassSectionId = classSectionResponse.ClassSectionId
        };
    }
}