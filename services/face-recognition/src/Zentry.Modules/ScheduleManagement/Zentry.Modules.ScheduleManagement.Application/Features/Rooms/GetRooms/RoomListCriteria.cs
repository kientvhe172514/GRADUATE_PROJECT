namespace Zentry.Modules.ScheduleManagement.Application.Features.Rooms.GetRooms;

public class RoomListCriteria
{
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public string? SearchTerm { get; set; }
    public string? Building { get; set; }
    public string? SortBy { get; set; }
    public string? SortOrder { get; set; } // "asc" or "desc"
}