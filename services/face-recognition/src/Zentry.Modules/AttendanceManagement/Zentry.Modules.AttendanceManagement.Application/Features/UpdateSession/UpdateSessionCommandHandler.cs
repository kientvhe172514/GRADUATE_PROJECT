// Sử dụng IMediator và IPublishEndpoint để gửi message

using MassTransit;
using Microsoft.Extensions.Logging;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.Modules.AttendanceManagement.Domain.Entities;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Attendance;
using Zentry.SharedKernel.Contracts.Events;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.AttendanceManagement.Application.Features.UpdateSession;

public class UpdateSessionCommandHandler(
    ISessionRepository sessionRepository,
    IPublishEndpoint publishEndpoint,
    ILogger<UpdateSessionCommandHandler> logger)
    : ICommandHandler<UpdateSessionCommand, UpdateSessionResponse>
{
    public async Task<UpdateSessionResponse> Handle(UpdateSessionCommand request, CancellationToken cancellationToken)
    {
        var session = await sessionRepository.GetByIdAsync(request.SessionId, cancellationToken);

        if (session is null) throw new NotFoundException(nameof(Session), request.SessionId);

        var oldLecturerId = session.LecturerId;
        var oldStartTime = session.StartTime;
        var oldEndTime = session.EndTime;
        var oldTotalRounds = session.SessionConfigs.TotalAttendanceRounds;

        session.Update(request.StartTime, request.EndTime);
        if (request.SessionConfigs != null && request.SessionConfigs.Any())
            session.UpdateConfigs(request.SessionConfigs);

        if (request.LecturerId.HasValue && session.Status == SessionStatus.Pending)
            session.AssignLecturer(request.LecturerId.Value);

        await sessionRepository.UpdateAsync(session, cancellationToken);
        await sessionRepository.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Session {SessionId} updated successfully.", session.Id);

        var timestampsChanged = oldStartTime != session.StartTime || oldEndTime != session.EndTime;
        var roundsChanged = oldTotalRounds != session.SessionConfigs.TotalAttendanceRounds || timestampsChanged;
        var lecturerChanged = oldLecturerId != session.LecturerId;

        if (roundsChanged && session.TotalAttendanceRounds > 0)
        {
            var updateRoundsMessage = new UpdateRoundsForSessionMessage(
                session.Id,
                session.StartTime,
                session.EndTime,
                session.TotalAttendanceRounds
            );
            await publishEndpoint.Publish(updateRoundsMessage, cancellationToken);
            logger.LogInformation("Published UpdateRoundsForSessionMessage for SessionId: {SessionId}.", session.Id);
        }

        if (lecturerChanged)
        {
            var updateWhitelistMessage = new AssignLecturerToWhitelistMessage(
                session.ScheduleId,
                session.LecturerId
            );
            await publishEndpoint.Publish(updateWhitelistMessage, cancellationToken);
            logger.LogInformation("Published UpdateWhitelistForSessionMessage for SessionId: {SessionId}.", session.Id);
        }

        return new UpdateSessionResponse
        {
            SessionId = session.Id,
            ScheduleId = session.ScheduleId,
            LecturerId = session.LecturerId,
            StartTime = session.StartTime,
            EndTime = session.EndTime,
            UpdatedAt = session.UpdatedAt,
            Status = session.Status,
            SessionConfigs = session.SessionConfigs
        };
    }
}