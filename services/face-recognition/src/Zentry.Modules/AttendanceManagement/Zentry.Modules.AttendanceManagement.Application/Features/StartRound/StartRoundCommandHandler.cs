using MassTransit;
using MediatR;
using Microsoft.Extensions.Logging;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.Modules.AttendanceManagement.Domain.Entities;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Attendance;
using Zentry.SharedKernel.Contracts.Events;
using Zentry.SharedKernel.Contracts.Schedule;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.AttendanceManagement.Application.Features.StartRound;

public class StartRoundCommandHandler(
    IRoundRepository roundRepository,
    ISessionRepository sessionRepository,
    IBus bus,
    IMediator mediator,
    ILogger<StartRoundCommandHandler> logger)
    : ICommandHandler<StartRoundCommand, StartRoundResponse>
{
    public async Task<StartRoundResponse> Handle(StartRoundCommand request, CancellationToken cancellationToken)
    {
        logger.LogInformation("Attempting to start round {RoundId} for session {SessionId} by lecturer {LecturerId}.",
            request.RoundId, request.SessionId, request.LecturerId);

        // 1. Validate session exists and lecturer has permission
        var session = await sessionRepository.GetByIdAsync(request.SessionId, cancellationToken);
        if (session is null) throw new NotFoundException(nameof(Session), request.SessionId);

        if (session.LecturerId != request.LecturerId)
            throw new BusinessRuleException("LECTURER_NOT_ASSIGNED", "Giảng viên không được phân công cho phiên này.");

        // 2. Validate round exists and belongs to session
        var round = await roundRepository.GetByIdAsync(request.RoundId, cancellationToken);
        if (round is null) throw new NotFoundException(nameof(Round), request.RoundId);

        if (round.SessionId != request.SessionId)
            throw new BusinessRuleException("ROUND_SESSION_MISMATCH", "Round không thuộc về session này.");

        // 3. Check if round can be started
        if (round.Status != RoundStatus.Pending)
            throw new BusinessRuleException("ROUND_NOT_PENDING",
                $"Round đã ở trạng thái {round.Status} và không thể start.");

        // 4. Deactivate any other active rounds in this session
        var activeRounds = await roundRepository.GetActiveRoundsBySessionIdAsync(request.SessionId, cancellationToken);
        foreach (var activeRound in activeRounds)
        {
            activeRound.UpdateStatus(RoundStatus.Completed);
            await roundRepository.UpdateAsync(activeRound, cancellationToken);
            logger.LogInformation("Completed previous active round {RoundId} for session {SessionId}.",
                activeRound.Id, request.SessionId);
        }

        // 5. Activate the requested round
        round.UpdateStatus(RoundStatus.Active);
        await roundRepository.UpdateAsync(round, cancellationToken);
        await roundRepository.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Successfully activated round {RoundId} (number {RoundNumber}) for session {SessionId}.",
            round.Id, round.RoundNumber, request.SessionId);

        // 6. Get ClassSectionId from ScheduleId
        var getClassSectionIdQuery = new GetClassSectionIdByScheduleIdIntegrationQuery(session.ScheduleId);
        var classSectionIdResponse = await mediator.Send(getClassSectionIdQuery, cancellationToken);

        // 7. Publish RoundActivatedEvent for other modules to handle
        var roundActivatedEvent = new RoundActivatedEvent
        {
            SessionId = request.SessionId,
            RoundId = round.Id,
            RoundNumber = round.RoundNumber,
            LecturerId = request.LecturerId,
            ClassSectionId = classSectionIdResponse.ClassSectionId,
            RequireFaceVerification = request.RequireFaceVerification,
            ActivatedAt = DateTime.UtcNow
        };
        await bus.Publish(roundActivatedEvent, cancellationToken);

        // 8. Send notifications to students if face verification is required
        if (request.RequireFaceVerification)
            await NotifyStudentsForFaceVerification(classSectionIdResponse.ClassSectionId, session, round,
                cancellationToken);

        return new StartRoundResponse
        {
            Success = true,
            Message = "Round started successfully",
            RoundId = round.Id,
            RoundNumber = round.RoundNumber,
            StartTime = round.StartTime,
            EndTime = round.EndTime
        };
    }

    private async Task NotifyStudentsForFaceVerification(Guid classSectionId, Session session, Round round,
        CancellationToken cancellationToken)
    {
        // Get list of students enrolled in this session via integration query
        var getStudentIdsQuery = new GetStudentIdsByClassSectionIdIntegrationQuery(classSectionId);
        var studentIdsResponse = await mediator.Send(getStudentIdsQuery, cancellationToken);
        var studentIds = studentIdsResponse.StudentIds;

        logger.LogInformation("Sending face verification notifications to {StudentCount} students for round {RoundId}.",
            studentIds.Count, round.Id);

        // Send notification to each student
        var notificationTasks = studentIds.Select(async studentId =>
        {
            var notificationEvent = new NotificationCreatedEvent
            {
                Title = "Điểm danh bằng Face ID",
                Body = $"Round {round.RoundNumber} đã bắt đầu. Vui lòng thực hiện xác thực khuôn mặt để điểm danh.",
                RecipientUserId = studentId,
                Type = NotificationType.All, // Both InApp and Push
                Data = new Dictionary<string, string>
                {
                    ["type"] = "FACE_VERIFICATION_REQUEST",
                    ["sessionId"] = session.Id.ToString(),
                    ["roundId"] = round.Id.ToString(),
                    ["roundNumber"] = round.RoundNumber.ToString(),
                    ["action"] = "VERIFY_FACE_ID"
                }
            };

            await bus.Publish(notificationEvent, cancellationToken);
        });

        await Task.WhenAll(notificationTasks);

        logger.LogInformation("Face verification notifications sent to all students for round {RoundId}.", round.Id);
    }
}