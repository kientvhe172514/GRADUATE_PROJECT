using System.Text.Json;
using Microsoft.Extensions.Logging;
using Zentry.Infrastructure.Caching;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.Modules.AttendanceManagement.Domain.Entities;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Attendance;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.AttendanceManagement.Application.Features.StartSession;

public class StartSessionCommandHandler(
    ISessionRepository sessionRepository,
    IRoundRepository roundRepository,
    IRedisService redisService,
    IScheduleWhitelistRepository scheduleWhitelistRepository,
    ILogger<StartSessionCommandHandler> logger)
    : ICommandHandler<StartSessionCommand, StartSessionResponse>
{
    public async Task<StartSessionResponse> Handle(StartSessionCommand request, CancellationToken cancellationToken)
    {
        logger.LogInformation("Attempting to start session {SessionId} by user {UserId}.", request.SessionId,
            request.LecturerId);

        var session = await sessionRepository.GetByIdAsync(request.SessionId, cancellationToken);
        if (session is null)
        {
            logger.LogWarning("StartSession failed: Session with ID {SessionId} not found.", request.SessionId);
            throw new NotFoundException(nameof(Session), request.SessionId);
        }

        if (session.LecturerId != request.LecturerId)
        {
            logger.LogWarning("StartSession failed: Lecturer {LecturerId} is not assigned to session {SessionId}.",
                request.LecturerId, request.SessionId);
            throw new BusinessRuleException("LECTURER_NOT_ASSIGNED", "Giảng viên không được phân công cho phiên này.");
        }

        if (!Equals(session.Status, SessionStatus.Pending))
        {
            logger.LogWarning(
                "StartSession failed: Session {SessionId} is not in Pending status. Current status: {Status}.",
                session.Id, session.Status);
            throw new BusinessRuleException("SESSION_NOT_PENDING", "Phiên điểm danh chưa ở trạng thái chờ kích hoạt.");
        }

        var sessionConfigSnapshot = session.SessionConfigs;
        var attendanceWindowMinutes = sessionConfigSnapshot.AttendanceWindowMinutes;
        var currentTime = DateTime.UtcNow;
        var sessionAllowedStartTime = session.StartTime.AddMinutes(-attendanceWindowMinutes);
        var sessionAllowedEndTime = session.EndTime.AddMinutes(attendanceWindowMinutes);

        if (currentTime < sessionAllowedStartTime || currentTime > sessionAllowedEndTime)
        {
            logger.LogWarning(
                "StartSession failed: Current time {CurrentTime} is outside allowed window ({AllowedStart} - {AllowedEnd}) for session {SessionId}. Configured window: {ConfigWindow} minutes.",
                currentTime, sessionAllowedStartTime, sessionAllowedEndTime, request.SessionId,
                attendanceWindowMinutes);
            throw new BusinessRuleException("OUT_OF_TIME_WINDOW",
                $"Chưa đến hoặc đã quá thời gian cho phép khởi tạo phiên. Giờ hiện tại: {currentTime:HH:mm}, Thời gian cho phép: {sessionAllowedStartTime:HH:mm} - {sessionAllowedEndTime:HH:mm}.");
        }

        var activeScheduleKey = $"active_schedule:{session.ScheduleId}";
        if (await redisService.KeyExistsAsync(activeScheduleKey))
        {
            logger.LogWarning("StartSession failed: An active session already exists for schedule {ScheduleId}.",
                session.ScheduleId);
            throw new BusinessRuleException("SESSION_ALREADY_ACTIVE",
                "Buổi học này đã có phiên điểm danh đang hoạt động.");
        }

        // --- 1. Kích hoạt Session ---
        session.ActivateSession();
        await sessionRepository.UpdateAsync(session, cancellationToken);
        await sessionRepository.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Session {SessionId} status updated to Active.", session.Id);

        // --- 2. Kích hoạt Round đầu tiên ---
        var firstRound = (await roundRepository.GetRoundsBySessionIdAsync(session.Id, cancellationToken))
            .FirstOrDefault(r => r.RoundNumber == 1);
        if (firstRound is not null)
        {
            firstRound.UpdateStatus(RoundStatus.Active);
            await roundRepository.UpdateAsync(firstRound, cancellationToken);
            await roundRepository.SaveChangesAsync(cancellationToken);
            logger.LogInformation("First round ({RoundId}) for Session {SessionId} status updated to Active.",
                firstRound.Id, session.Id);
        }
        else
        {
            logger.LogWarning("No first round found for Session {SessionId} to activate.", session.Id);
        }

        // --- 3. Tải Whitelist từ DocumentDB (Schedule) và cache vào Redis (Session) ---
        var scheduleWhitelist =
            await scheduleWhitelistRepository.GetByScheduleIdAsync(session.ScheduleId, cancellationToken);
        if (scheduleWhitelist != null)
        {
            var whitelistJson = JsonSerializer.Serialize(scheduleWhitelist.WhitelistedDeviceIds);
            var totalSessionDuration = session.EndTime.Subtract(currentTime)
                .Add(TimeSpan.FromMinutes(session.AttendanceWindowMinutes * 2));

            await redisService.SetAsync($"session_whitelist:{session.Id}", whitelistJson, totalSessionDuration);
            logger.LogInformation(
                "Whitelist for Session {SessionId} loaded from Schedule {ScheduleId} and cached in Redis. Total devices: {DeviceCount}.",
                session.Id, session.ScheduleId, scheduleWhitelist.WhitelistedDeviceIds.Count);
        }
        else
        {
            logger.LogWarning(
                "No whitelist found in DocumentDB for Schedule {ScheduleId}. An empty whitelist will be cached to prevent errors.",
                session.ScheduleId);
            await redisService.SetAsync($"session_whitelist:{session.Id}", "[]",
                TimeSpan.FromMinutes(5));
        }

        // --- 4. Cập nhật các cờ trạng thái trong Redis ---
        var totalRemainingDuration = session.EndTime.Subtract(currentTime)
            .Add(TimeSpan.FromMinutes(sessionConfigSnapshot.AttendanceWindowMinutes * 2));

        await redisService.SetAsync($"session:{session.Id}", SessionStatus.Active.ToString(), totalRemainingDuration);
        await redisService.SetAsync(activeScheduleKey, session.Id.ToString(), totalRemainingDuration);

        // --- 5. (Optional) Gửi thông báo đến các máy trong lớp ---
        logger.LogInformation("Sending session started notification for Session {SessionId}.", session.Id);

        // --- 6. Trả về Response ---
        return new StartSessionResponse
        {
            SessionId = session.Id,
            ScheduleId = session.ScheduleId,
            LecturerId = session.LecturerId,
            StartTime = session.StartTime,
            EndTime = session.EndTime,
            CreatedAt = session.CreatedAt,
            Status = session.Status
        };
    }
}