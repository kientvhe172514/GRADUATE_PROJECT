using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Attendance;

public record GetLecturerClassOverviewIntegrationQuery(List<Guid> ScheduleIds)
    : IQuery<GetLecturerClassOverviewIntegrationResponse>;

public record GetLecturerClassOverviewIntegrationResponse(
    List<OverviewSessionDto> Sessions,
    List<OverviewAttendanceDto> AttendanceRecords);

public record OverviewSessionDto
{
    public Guid Id { get; set; }
    public Guid ScheduleId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
}

public record OverviewAttendanceDto
{
    public Guid SessionId { get; set; }
    public Guid StudentId { get; set; }
    public string Status { get; set; } = string.Empty;
}