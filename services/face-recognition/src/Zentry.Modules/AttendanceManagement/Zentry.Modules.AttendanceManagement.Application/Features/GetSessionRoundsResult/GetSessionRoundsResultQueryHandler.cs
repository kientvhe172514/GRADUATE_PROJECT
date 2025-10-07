using Microsoft.Extensions.Logging;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.Modules.AttendanceManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.AttendanceManagement.Application.Features.GetSessionRoundsResult;

public class GetSessionRoundsResultQueryHandler(
    ISessionRepository sessionRepository,
    IRoundRepository roundRepository,
    IRoundTrackRepository roundTrackRepository,
    ILogger<GetSessionRoundsResultQueryHandler> logger)
    : IQueryHandler<GetSessionRoundsResultQuery, SessionRoundsResultDto>
{
    public async Task<SessionRoundsResultDto> Handle(GetSessionRoundsResultQuery request,
        CancellationToken cancellationToken)
    {
        logger.LogInformation("Handling GetSessionRoundsResultQuery for SessionId: {SessionId}", request.SessionId);

        // 1. Lấy thông tin Session
        var session = await sessionRepository.GetByIdAsync(request.SessionId, cancellationToken);
        if (session is null)
        {
            logger.LogWarning("Session with ID {SessionId} not found.", request.SessionId);
            throw new NotFoundException("Session", $"Phiên học với ID '{request.SessionId}' không tìm thấy.");
        }

        // 2. Lấy tất cả các Rounds thuộc Session này
        var rounds = await roundRepository.GetRoundsBySessionIdAsync(request.SessionId, cancellationToken);
        if (!rounds.Any())
        {
            logger.LogInformation("No rounds found for Session with ID {SessionId}.", request.SessionId);
            return new SessionRoundsResultDto
            {
                SessionId = session.Id,
                StartTime = session.StartTime,
                EndTime = session.EndTime,
                Status = session.Status.ToString(),
                TotalAttendanceRounds = session.TotalAttendanceRounds,
                Rounds = []
            };
        }

        // 3. Lặp qua các Rounds để lấy thông tin điểm danh chi tiết từ RoundTrack
        var roundsResult = new List<RoundResultDto>();
        foreach (var round in rounds)
        {
            var roundTrack = await roundTrackRepository.GetRoundTracksByRoundIdAsync(round.Id, cancellationToken);

            var studentAttendances = new List<StudentAttendanceDto>();
            if (roundTrack != null && roundTrack.Students.Count != 0)
                studentAttendances.AddRange(roundTrack.Students.Select(s => new StudentAttendanceDto
                {
                    StudentCode = s.StudentCode,
                    IsAttended = s.IsAttended,
                    AttendedTime = s.AttendedTime
                }));

            roundsResult.Add(new RoundResultDto
            {
                RoundId = round.Id,
                RoundNumber = round.RoundNumber,
                StartTime = round.StartTime,
                EndTime = round.EndTime,
                Status = round.Status.ToString(),
                StudentsAttendance = studentAttendances
            });
        }

        return new SessionRoundsResultDto
        {
            SessionId = session.Id,
            StartTime = session.StartTime,
            EndTime = session.EndTime,
            Status = session.Status.ToString(),
            TotalAttendanceRounds = session.TotalAttendanceRounds,
            Rounds = roundsResult
        };
    }
}