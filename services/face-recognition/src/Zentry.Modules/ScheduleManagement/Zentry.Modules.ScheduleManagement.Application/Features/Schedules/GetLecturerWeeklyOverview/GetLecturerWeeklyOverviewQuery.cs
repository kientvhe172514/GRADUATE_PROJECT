using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Schedules.GetLecturerWeeklyOverview;

public record GetLecturerWeeklyOverviewQuery(Guid LecturerId) : IQuery<List<WeeklyOverviewDto>>;

public class LecturerHomeResponse
{
    public List<NextSessionDto> NextSessions { get; set; } = [];
    public List<WeeklyOverviewDto> WeeklyOverview { get; set; } = [];
}