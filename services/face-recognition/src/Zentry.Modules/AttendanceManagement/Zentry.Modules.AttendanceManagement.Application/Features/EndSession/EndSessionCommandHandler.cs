using MassTransit;
using MediatR;
using Microsoft.Extensions.Logging;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.Modules.AttendanceManagement.Domain.Entities;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Attendance;
using Zentry.SharedKernel.Constants.Response;
using Zentry.SharedKernel.Contracts.Events;
using Zentry.SharedKernel.Contracts.Schedule;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.AttendanceManagement.Application.Features.EndSession;

public class EndSessionCommandHandler(
    ISessionRepository sessionRepository,
    IRoundRepository roundRepository,
    IPublishEndpoint publishEndpoint,
    IMediator mediator,
    ILogger<EndSessionCommandHandler> logger)
    : ICommandHandler<EndSessionCommand, EndSessionResponse>
{
    public async Task<EndSessionResponse> Handle(EndSessionCommand request, CancellationToken cancellationToken)
    {
        logger.LogInformation("Attempting to end session {SessionId} by user {UserId}.",
            request.SessionId, request.LecturerId);

        var session = await sessionRepository.GetByIdAsync(request.SessionId, cancellationToken);
        if (session is null)
        {
            logger.LogWarning("EndSession failed: Session with ID {SessionId} not found.", request.SessionId);
            throw new NotFoundException(nameof(EndSessionCommandHandler), request.SessionId);
        }

        if (session.LecturerId != request.LecturerId)
        {
            logger.LogWarning("EndSession failed: Lecturer {LecturerId} is not assigned to session {SessionId}.",
                request.LecturerId, request.SessionId);
            throw new BusinessRuleException("LECTURER_NOT_ASSIGNED", "Giảng viên không được phân công cho phiên này.");
        }

        if (!Equals(session.Status, SessionStatus.Active))
        {
            logger.LogWarning(
                "EndSession failed: Session {SessionId} is not in Active status. Current status: {Status}.",
                session.Id, session.Status);
            throw new BusinessRuleException(ErrorCodes.SessionNotActive, ErrorMessages.Attendance.SessionNotActive);
        }

        // Get all rounds and categorize them
        var allRounds = await roundRepository.GetRoundsBySessionIdAsync(session.Id, cancellationToken);
        var activeRound = allRounds.FirstOrDefault(r => Equals(r.Status, RoundStatus.Active));
        var pendingRounds = allRounds.Where(r => Equals(r.Status, RoundStatus.Pending)).ToList();

        if (activeRound is not null)
        {
            // Publish message to process active round asynchronously with retry capability
            var message = new ProcessActiveRoundForEndSessionMessage
            {
                SessionId = session.Id,
                ActiveRoundId = activeRound.Id,
                UserId = request.LecturerId,
                PendingRoundIds = pendingRounds.Select(pr => pr.Id).ToList()
            };

            await publishEndpoint.Publish(message, cancellationToken);

            logger.LogInformation(
                "End session processing message published for Session {SessionId} with active round {RoundId}",
                session.Id, activeRound.Id);
        }
        else
        {
            // No active round - handle only pending rounds and complete session directly
            logger.LogInformation("No active round found for session {SessionId}, processing directly", session.Id);

            await ProcessEndSessionWithoutActiveRound(session, pendingRounds, cancellationToken);
        }

        // Send notifications to all students about session ending early
        await NotifyStudentsAboutSessionEndingEarly(session, cancellationToken);

        // Return response indicating the operation has been queued/processed
        return new EndSessionResponse
        {
            SessionId = session.Id,
            Status = activeRound is not null ? "Processing" : session.Status.ToString(),
            EndTime = session.EndTime,
            UpdatedAt = session.UpdatedAt,
            ActualRoundsCompleted = allRounds.Count(r => Equals(r.Status, RoundStatus.Completed)),
            RoundsFinalized = pendingRounds.Count
        };
    }

    private async Task NotifyStudentsAboutSessionEndingEarly(Session session, CancellationToken cancellationToken)
    {
        try
        {
            // 1. Get ClassSectionId from ScheduleId
            var classSectionResponse = await mediator.Send(
                new GetClassSectionByScheduleIdIntegrationQuery(session.ScheduleId),
                cancellationToken);

            if (classSectionResponse.ClassSectionId == Guid.Empty)
            {
                logger.LogWarning("Could not find ClassSection for Schedule {ScheduleId}, skipping notifications",
                    session.ScheduleId);
                return;
            }

            // 2. Get all student IDs enrolled in this class section
            var studentIdsResponse = await mediator.Send(
                new GetStudentIdsByClassSectionIdIntegrationQuery(classSectionResponse.ClassSectionId),
                cancellationToken);

            if (studentIdsResponse.StudentIds.Count == 0)
            {
                logger.LogInformation("No students found for ClassSection {ClassSectionId}, skipping notifications",
                    classSectionResponse.ClassSectionId);
                return;
            }

            // 3. Create deeplink to StudentScheduleClassDetailFragment
            var deeplink =
                $"zentry://schedule-detail?scheduleId={session.ScheduleId}&classSectionId={classSectionResponse.ClassSectionId}";

            // 4. Send notifications to all students
            var title = "Tiết học đã kết thúc sớm";
            var body = "Giảng viên đã kết thúc tiết học sớm hơn dự kiến.";

            var notificationTasks = studentIdsResponse.StudentIds.Select(studentId =>
                publishEndpoint.Publish(new NotificationCreatedEvent
                {
                    Title = title,
                    Body = body,
                    RecipientUserId = studentId,
                    Type = NotificationType.All, // Both InApp and Push
                    Data = new Dictionary<string, string>
                    {
                        ["type"] = "SESSION_ENDED_EARLY",
                        ["sessionId"] = session.Id.ToString(),
                        ["scheduleId"] = session.ScheduleId.ToString(),
                        ["classSectionId"] = classSectionResponse.ClassSectionId.ToString(),
                        ["deeplink"] = deeplink,
                        ["action"] = "VIEW_SCHEDULE_DETAIL",
                        ["courseName"] = classSectionResponse.CourseName,
                        ["sectionCode"] = classSectionResponse.SectionCode
                    }
                }, cancellationToken));

            await Task.WhenAll(notificationTasks);

            logger.LogInformation(
                "Session ended early notifications sent to {StudentCount} students for Session {SessionId}",
                studentIdsResponse.StudentIds.Count, session.Id);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send session ended early notifications for Session {SessionId}",
                session.Id);
            // Don't throw - notification failure shouldn't prevent session from ending
        }
    }

    private async Task ProcessEndSessionWithoutActiveRound(
        Session session,
        List<Round> pendingRounds,
        CancellationToken cancellationToken)
    {
        // Mark pending rounds as Finalized
        foreach (var pendingRound in pendingRounds)
        {
            pendingRound.UpdateStatus(RoundStatus.Finalized);
            await roundRepository.UpdateAsync(pendingRound, cancellationToken);
            logger.LogInformation("Pending round {RoundId} marked as Finalized", pendingRound.Id);
        }

        await roundRepository.SaveChangesAsync(cancellationToken);

        // Complete session
        session.CompleteSession();
        await sessionRepository.UpdateAsync(session, cancellationToken);
        await sessionRepository.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Session {SessionId} completed directly (no active round)", session.Id);

        // Publish final attendance processing message
        var allRounds = await roundRepository.GetRoundsBySessionIdAsync(session.Id, cancellationToken);
        var completedRoundsCount = allRounds.Count(r => Equals(r.Status, RoundStatus.Completed));

        var finalMessage = new SessionFinalAttendanceToProcessMessage
        {
            SessionId = session.Id,
            ActualRoundsCount = completedRoundsCount
        };
        await publishEndpoint.Publish(finalMessage, cancellationToken);
        logger.LogInformation(
            "SessionFinalAttendanceToProcess message published for Session {SessionId} with {ActualRounds} actual rounds.",
            session.Id, completedRoundsCount);
    }
}