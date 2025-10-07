using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Attendance;

public record GetAttendanceDataByScheduleIdsIntegrationQuery(List<Guid> ScheduleIds)
    : IQuery<List<GetAttendanceDataByScheduleIdsIntegrationResponse>>;

public record GetAttendanceDataByScheduleIdsIntegrationResponse
{
    public Guid ScheduleId { get; set; }
    public List<OverviewAttendanceDto> AttendanceRecords { get; set; }
}