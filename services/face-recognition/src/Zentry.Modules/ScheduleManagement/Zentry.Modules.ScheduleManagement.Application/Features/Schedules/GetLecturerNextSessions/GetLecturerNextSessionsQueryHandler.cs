using MediatR;
using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Attendance;
using Zentry.SharedKernel.Contracts.User;
using Zentry.SharedKernel.Exceptions;
using Zentry.SharedKernel.Extensions;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Schedules.GetLecturerNextSessions;

public class GetLecturerNextSessionsQueryHandler(
    IClassSectionRepository classSectionRepository,
    IMediator mediator
) : IQueryHandler<GetLecturerNextSessionsQuery, List<NextSessionDto>>
{
    public async Task<List<NextSessionDto>> Handle(GetLecturerNextSessionsQuery request,
        CancellationToken cancellationToken)
    {
        var response =
            await mediator.Send(new CheckUserExistIntegrationQuery(request.LecturerId), cancellationToken);

        if (response.IsExist == false) throw new ResourceNotFoundException("Lecturer", request.LecturerId);

        var nextSessions = new List<NextSessionDto>();

        var classSections =
            await classSectionRepository.GetLecturerClassSectionsAsync(request.LecturerId, cancellationToken);

        if (classSections.Count == 0)
            throw new ResourceNotFoundException(
                $"Lecturer with id {request.LecturerId} is not assigned to any class section.");

        var allScheduleIds = classSections.SelectMany(cs => cs.Schedules.Select(s => s.Id)).ToList();

        var upcomingSessionsResponse = await mediator.Send(
            new GetUpcomingSessionsByScheduleIdsIntegrationQuery(allScheduleIds),
            cancellationToken);

        foreach (var session in upcomingSessionsResponse.Sessions)
        {
            var correspondingClassSection = classSections
                .FirstOrDefault(cs => cs.Schedules.Any(s => s.Id == session.ScheduleId));

            if (correspondingClassSection is null) continue;

            var room = correspondingClassSection.Schedules
                .FirstOrDefault(s => s.Id == session.ScheduleId)?.Room;

            nextSessions.Add(new NextSessionDto
            {
                SessionId = session.Id,
                ClassSectionId = correspondingClassSection.Id,
                ClassTitle = $"{correspondingClassSection.Course?.Name} - {correspondingClassSection.SectionCode}",
                CourseCode = correspondingClassSection.Course?.Code ?? string.Empty,
                SectionCode = correspondingClassSection.SectionCode,
                StartDate = session.StartTime.ToVietnamLocalTime().ToDateOnly(),
                StartTime = session.StartTime.ToVietnamLocalTime().ToTimeOnly(),
                EndDate = session.EndTime.ToVietnamLocalTime().ToDateOnly(),
                EndTime = session.EndTime.ToVietnamLocalTime().ToTimeOnly(),
                RoomInfo = $"{room?.RoomName} ({room?.Building})",
                EnrolledStudents = correspondingClassSection.Enrollments.Count,
                Status = session.Status
            });
        }

        return nextSessions.OrderBy(s => s.StartDate).ThenBy(s => s.StartTime).ToList();
    }
}