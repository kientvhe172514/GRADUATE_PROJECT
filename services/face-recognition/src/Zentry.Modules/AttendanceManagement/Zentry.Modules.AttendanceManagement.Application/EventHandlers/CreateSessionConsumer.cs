using MassTransit;
using MediatR;
using Microsoft.Extensions.Logging;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.Modules.AttendanceManagement.Application.Services;
using Zentry.Modules.AttendanceManagement.Application.Services.Interface;
using Zentry.Modules.AttendanceManagement.Domain.Entities;
using Zentry.Modules.AttendanceManagement.Domain.ValueObjects;
using Zentry.SharedKernel.Contracts.Configuration;
using Zentry.SharedKernel.Contracts.Events;
using Zentry.SharedKernel.Contracts.Schedule;
using Zentry.SharedKernel.Exceptions;
using Zentry.SharedKernel.Extensions;

namespace Zentry.Modules.AttendanceManagement.Application.EventHandlers;

public class CreateSessionConsumer(
    ILogger<CreateSessionConsumer> logger,
    ISessionRepository sessionRepository,
    IConfigurationService configService,
    IPublishEndpoint publishEndpoint,
    IMediator mediator)
    : IConsumer<ScheduleCreatedMessage>
{
    public async Task Consume(ConsumeContext<ScheduleCreatedMessage> context)
    {
        var message = context.Message;
        logger.LogInformation(
            "MassTransit Consumer: Received ScheduleCreatedEvent for ScheduleId: {ScheduleId}, WeekDay: {WeekDay}.",
            message.ScheduleId, message.WeekDay);

        try
        {
            logger.LogInformation("Fetching all relevant settings for schedule {ScheduleId}.", message.ScheduleId);

            var requests = new List<ScopeQueryRequest>
            {
                new(AttendanceScopeTypes.Global, Guid.Empty),
                new(AttendanceScopeTypes.Session, message.ScheduleId)
            };
            if (message.CourseId != Guid.Empty)
                requests.Add(new ScopeQueryRequest(AttendanceScopeTypes.Course, message.CourseId));

            var allSettingsResponse =
                await configService.GetMultipleSettingsInBatchAsync(requests, context.CancellationToken);

            var globalSettings = allSettingsResponse.SettingsByScopeType
                .GetValueOrDefault(AttendanceScopeTypes.Global, new List<SettingContract>())
                .ToDictionary(s => s.AttributeKey, s => s.Value ?? string.Empty, StringComparer.OrdinalIgnoreCase);

            var courseSettings = allSettingsResponse.SettingsByScopeType
                .GetValueOrDefault(AttendanceScopeTypes.Course, new List<SettingContract>())
                .ToDictionary(s => s.AttributeKey, s => s.Value ?? string.Empty, StringComparer.OrdinalIgnoreCase);

            var sessionSettings = allSettingsResponse.SettingsByScopeType
                .GetValueOrDefault(AttendanceScopeTypes.Session, new List<SettingContract>())
                .ToDictionary(s => s.AttributeKey, s => s.Value ?? string.Empty, StringComparer.OrdinalIgnoreCase);

            var finalConfigDictionary = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            foreach (var setting in globalSettings) finalConfigDictionary[setting.Key] = setting.Value;

            // Thêm Course settings (ghi đè Global)
            foreach (var setting in courseSettings) finalConfigDictionary[setting.Key] = setting.Value;

            // Thêm Session settings (ghi đè Global và Course)
            foreach (var setting in sessionSettings) finalConfigDictionary[setting.Key] = setting.Value;

            if (message.CourseId != Guid.Empty)
            {
                var courseCodeResponse = await mediator.Send(new GetCourseCodeIntegrationQuery(message.CourseId),
                    context.CancellationToken);
                var courseCode = courseCodeResponse.CourseCode;
                if (!string.IsNullOrEmpty(courseCode)) finalConfigDictionary["courseCode"] = courseCode;
            }

            if (message.ClassSectionId != Guid.Empty)
            {
                var sectionCodeResponse =
                    await mediator.Send(new GetSectionCodeIntegrationQuery(message.ClassSectionId),
                        context.CancellationToken);
                var sectionCode = sectionCodeResponse.SectionCode;
                if (!string.IsNullOrEmpty(sectionCode)) finalConfigDictionary["sectionCode"] = sectionCode;
            }

            var sessionConfigSnapshot = SessionConfigSnapshot.FromDictionary(finalConfigDictionary);

            // Các giá trị cấu hình liên quan đến thời gian và rounds
            var attendanceWindowMinutes = sessionConfigSnapshot.AttendanceWindowMinutes;
            var totalAttendanceRounds =
                sessionConfigSnapshot.TotalAttendanceRounds;

            var currentTime = DateTime.UtcNow;
            var currentDate = DateOnly.FromDateTime(currentTime);

            DayOfWeek systemDayOfWeek;
            try
            {
                systemDayOfWeek = (DayOfWeek)Enum.Parse(typeof(DayOfWeek), message.WeekDay, true);
            }
            catch (ArgumentException ex)
            {
                logger.LogError(ex,
                    "Invalid WeekDay string '{WeekDay}' received for ScheduleId {ScheduleId}. Cannot parse to System.DayOfWeek.",
                    message.WeekDay, message.ScheduleId);
                throw new BusinessRuleException("INVALID_WEEKDAY_FORMAT", $"Invalid WeekDay string: {message.WeekDay}");
            }

            var sessionsToPersist = new List<Session>();
            var sessionNumber = 1;
            for (var date = message.ScheduledStartDate; date <= message.ScheduledEndDate; date = date.AddDays(1))
                if (date.DayOfWeek == systemDayOfWeek)
                {
                    var todaySessionStartUnspecified = date.ToDateTime(message.ScheduledStartTime);
                    var todaySessionEndUnspecified = date.ToDateTime(message.ScheduledEndTime);

                    // Xử lý trường hợp endTime qua nửa đêm
                    if (message.ScheduledEndTime < message.ScheduledStartTime)
                        todaySessionEndUnspecified = todaySessionEndUnspecified.AddDays(1);

                    var todaySessionStartUtc = todaySessionStartUnspecified.ToUtcFromVietnamLocalTime();
                    var todaySessionEndUtc = todaySessionEndUnspecified.ToUtcFromVietnamLocalTime();

                    var session = Session.Create(
                        message.ScheduleId,
                        message.LecturerId,
                        todaySessionStartUtc,
                        todaySessionEndUtc,
                        finalConfigDictionary,
                        sessionNumber
                    );
                    sessionsToPersist.Add(session);
                    sessionNumber++;
                    logger.LogInformation(
                        "Prepared Session {SessionId} for Schedule {ScheduleId} on {SessionDate} (UTC: {UtcStart:HH:mm}).",
                        session.Id, message.ScheduleId, date.ToShortDateString(), todaySessionStartUtc);
                }

            if (sessionsToPersist.Count > 0)
            {
                await sessionRepository.AddRangeAsync(sessionsToPersist, context.CancellationToken);
                await sessionRepository.SaveChangesAsync(context.CancellationToken);
                logger.LogInformation(
                    "Successfully created and saved {NumSessions} sessions for Schedule {ScheduleId}.",
                    sessionsToPersist.Count, message.ScheduleId);

                foreach (var session in sessionsToPersist)
                {
                    var currentSessionConfigSnapshot = session.SessionConfigs;

                    var sessionCreatedMessage = new SessionCreatedMessage(
                        session.Id,
                        session.ScheduleId,
                        session.StartTime,
                        session.EndTime,
                        session.SessionNumber,
                        session.CreatedAt
                    );
                    await publishEndpoint.Publish(sessionCreatedMessage, context.CancellationToken);
                    logger.LogInformation("Published SessionCreatedMessage for SessionId: {SessionId}.", session.Id);

                    if (currentSessionConfigSnapshot.TotalAttendanceRounds > 0)
                    {
                        var createRoundsMessage = new CreateRoundsMessage(
                            session.Id,
                            currentSessionConfigSnapshot.TotalAttendanceRounds,
                            session.StartTime,
                            session.EndTime
                        );
                        await publishEndpoint.Publish(createRoundsMessage, context.CancellationToken);
                        logger.LogInformation("Published CreateSessionRoundsMessage for SessionId: {SessionId}.",
                            session.Id);
                    }
                    else
                    {
                        logger.LogInformation(
                            "No rounds will be created for Session {SessionId} as TotalAttendanceRounds is 0.",
                            session.Id);
                    }
                }
            }
            else
            {
                logger.LogInformation("No sessions to create for Schedule {ScheduleId}.", message.ScheduleId);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "MassTransit Consumer: Error processing ScheduleCreatedEvent for ScheduleId {ScheduleId}.",
                message.ScheduleId);
            throw;
        }
    }
}