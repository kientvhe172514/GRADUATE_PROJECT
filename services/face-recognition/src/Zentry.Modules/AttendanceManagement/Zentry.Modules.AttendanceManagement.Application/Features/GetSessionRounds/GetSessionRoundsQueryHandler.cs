using MediatR;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.Modules.AttendanceManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Schedule;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.AttendanceManagement.Application.Features.GetSessionRounds;

public class GetSessionRoundsQueryHandler(
    IRoundRepository roundRepository,
    IRoundTrackRepository roundTrackRepository,
    ISessionRepository sessionRepository,
    IMediator mediator)
    : IQueryHandler<GetSessionRoundsQuery, List<RoundAttendanceDto>>
{
    public async Task<List<RoundAttendanceDto>> Handle(GetSessionRoundsQuery request,
        CancellationToken cancellationToken)
    {
        var rounds = await roundRepository.GetRoundsBySessionIdAsync(request.SessionId, cancellationToken);
        if (rounds is null || rounds.Count == 0)
            throw new ResourceNotFoundException("Rounds for Session", request.SessionId);

        var session = await sessionRepository.GetByIdAsync(request.SessionId, cancellationToken);

        if (session is null)
            throw new ResourceNotFoundException("Session", request.SessionId);

        var classSectionResponse =
            await mediator.Send(
                new GetClassSectionByScheduleIdIntegrationQuery(session.ScheduleId),
                cancellationToken);

        if (classSectionResponse == null || classSectionResponse.ClassSectionId == Guid.Empty)
            throw new BusinessRuleException("CLASS_SECTION_NOT_FOUND",
                "Không tìm thấy thông tin lớp học cho buổi học này.");

        var classSectionId = classSectionResponse.ClassSectionId;

        var totalStudentsCountResponse = await mediator.Send(
            new CountActiveStudentsByClassSectionIdIntegrationQuery(classSectionId),
            cancellationToken);

        var roundIds = rounds.Select(r => r.Id).ToList();

        var roundTracks = await roundTrackRepository.GetRoundTracksByRoundIdsAsync(roundIds, cancellationToken);

        var roundTrackMap = roundTracks.ToDictionary(rt => rt.Id);

        var result = (from round in rounds
            let roundTrack = roundTrackMap.GetValueOrDefault(round.Id)
            select new RoundAttendanceDto
            {
                RoundId = round.Id,
                SessionId = request.SessionId,
                RoundNumber = round.RoundNumber,
                StartTime = round.StartTime,
                EndTime = round.EndTime,
                AttendedCount = roundTrack?.Students?.Count ?? 0,
                TotalStudents = totalStudentsCountResponse.TotalStudents,
                Status = round.Status.ToString()
            }).ToList();

        return result.OrderBy(r => r.RoundNumber).ToList();
    }
}