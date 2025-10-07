namespace Zentry.Modules.AttendanceManagement.Domain.Entities;

public class ScheduleWhitelist
{
    public ScheduleWhitelist()
    {
        WhitelistedDeviceIds = [];
    }

    private ScheduleWhitelist(Guid id, Guid scheduleId, List<Guid> whitelistedDeviceIds)
    {
        Id = id;
        ScheduleId = scheduleId;
        WhitelistedDeviceIds = whitelistedDeviceIds;
        GeneratedAt = DateTime.UtcNow;
        LastUpdatedAt = DateTime.UtcNow;
    }

    public Guid Id { get; set; }
    public Guid ScheduleId { get; set; }
    public List<Guid> WhitelistedDeviceIds { get; set; }
    public DateTime GeneratedAt { get; set; }
    public DateTime? LastUpdatedAt { get; set; }

    public static ScheduleWhitelist Create(Guid scheduleId, List<Guid> whitelistedDeviceIds)
    {
        return new ScheduleWhitelist(Guid.NewGuid(), scheduleId, whitelistedDeviceIds);
    }

    public void UpdateWhitelist(List<Guid> newWhitelist)
    {
        WhitelistedDeviceIds = newWhitelist;
        LastUpdatedAt = DateTime.UtcNow;
    }
}