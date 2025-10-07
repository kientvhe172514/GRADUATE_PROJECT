using System.ComponentModel.DataAnnotations;
using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Schedule;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Schedules.GetSchedules;

public record GetSchedulesQuery(
    [Range(1, int.MaxValue)] int PageNumber = 1,
    [Range(1, 100)] int PageSize = 10,
    Guid? LecturerId = null,
    Guid? ClassSectionId = null,
    Guid? RoomId = null,
    WeekDayEnum? WeekDay = null,
    string? SearchTerm = null,
    string? SortBy = null,
    string? SortOrder = "asc"
) : IQuery<GetSchedulesResponse>;

public class GetSchedulesResponse
{
    public List<ScheduleDto> Schedules { get; set; } = [];
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasPreviousPage => PageNumber > 1;
    public bool HasNextPage => PageNumber < TotalPages;
}