using MediatR;
using Microsoft.Extensions.Logging;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.Modules.AttendanceManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Device;
using Zentry.SharedKernel.Contracts.User;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.AttendanceManagement.Application.Features.GetRoundResult;

public class GetRoundResultQueryHandler(
    IRoundRepository roundRepository,
    IRoundTrackRepository roundTrackRepository,
    IScheduleWhitelistRepository scheduleWhitelistRepository,
    ISessionRepository sessionRepository,
    IMediator mediator,
    ILogger<GetRoundResultQueryHandler> logger)
    : IQueryHandler<GetRoundResultQuery, RoundResultDto>
{
    public async Task<RoundResultDto> Handle(GetRoundResultQuery request, CancellationToken cancellationToken)
    {
        logger.LogInformation("Handling GetRoundResultQuery for RoundId: {RoundId}", request.RoundId);

        // 1. Lấy thông tin Round và Session
        var round = await roundRepository.GetByIdAsync(request.RoundId, cancellationToken);
        if (round is null)
        {
            logger.LogWarning("Round with ID {RoundId} not found.", request.RoundId);
            throw new NotFoundException("Round", $"Vòng điểm danh với ID '{request.RoundId}' không tìm thấy.");
        }

        var session = await sessionRepository.GetByIdAsync(round.SessionId, cancellationToken);
        if (session is null)
        {
            logger.LogWarning("Session with ID {SessionId} not found.", round.SessionId);
            throw new NotFoundException("Session", $"Phiên với ID '{round.SessionId}' không tìm thấy.");
        }

        var lecturerId = session.LecturerId;


        // 2. Lấy danh sách whitelistedDeviceIds từ ScheduleWhitelist (thay vì SessionWhitelist)
        var scheduleWhitelist =
            await scheduleWhitelistRepository.GetByScheduleIdAsync(session.ScheduleId, cancellationToken);
        if (scheduleWhitelist == null || scheduleWhitelist.WhitelistedDeviceIds.Count == 0)
        {
            logger.LogWarning("No whitelist found for ScheduleId: {ScheduleId}. Returning empty result.",
                session.ScheduleId);
            return new RoundResultDto
            {
                RoundId = round.Id,
                RoundNumber = round.RoundNumber,
                Status = round.Status.ToString(),
                StartTime = round.StartTime,
                EndTime = round.EndTime,
                StudentsAttendance = []
            };
        }

        var deviceIds = scheduleWhitelist.WhitelistedDeviceIds;

        // 3. Lấy danh sách UserIds từ DeviceIds (qua Device module)
        var userIdsByDevicesResponse = await mediator.Send(
            new GetUserIdsByDevicesIntegrationQuery(deviceIds),
            cancellationToken);

        var userIds = userIdsByDevicesResponse.UserDeviceMap.Values
            .Where(id => lecturerId.HasValue && !Equals(id, lecturerId.Value))
            .ToList();
        if (userIds.Count == 0)
        {
            logger.LogInformation("No user IDs found for the whitelisted devices. Returning empty result.");
            return new RoundResultDto
            {
                RoundId = round.Id,
                RoundNumber = round.RoundNumber,
                Status = round.Status.ToString(),
                StartTime = round.StartTime,
                EndTime = round.EndTime,
                StudentsAttendance = []
            };
        }

        var usersResponse = await mediator.Send(
            new GetUsersByIdsIntegrationQuery(userIds),
            cancellationToken);

        var allStudents = usersResponse.Users;
        var roundTrack = await roundTrackRepository.GetRoundTracksByRoundIdAsync(request.RoundId, cancellationToken);

        var attendedStudentsMap = new Dictionary<Guid, (bool IsAttended, DateTime? AttendedTime)>();
        if (roundTrack != null && roundTrack.Students.Count != 0)
            attendedStudentsMap = roundTrack.Students.ToDictionary(
                s => s.StudentId,
                s => (s.IsAttended, s.AttendedTime)
            );

        var studentsAttendance = allStudents.Select(student =>
        {
            var (isAttended, attendedTime) = attendedStudentsMap.GetValueOrDefault(student.Id, (false, null));

            return new StudentAttendanceDto
            {
                StudentCode = student.Code,
                FullName = student.FullName,
                IsAttended = isAttended,
                AttendedTime = attendedTime
            };
        }).ToList();

        return new RoundResultDto
        {
            RoundId = round.Id,
            RoundNumber = round.RoundNumber,
            Status = round.Status.ToString(),
            StartTime = round.StartTime,
            EndTime = round.EndTime,
            StudentsAttendance = studentsAttendance
        };
    }
}