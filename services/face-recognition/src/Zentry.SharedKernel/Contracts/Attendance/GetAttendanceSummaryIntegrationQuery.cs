using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Attendance;

public record GetAttendanceSummaryIntegrationQuery(Guid ScheduleId, Guid ClassSectionId, DateTime Date)
    : IQuery<AttendanceSummaryIntegrationResponse>;

public class AttendanceSummaryIntegrationResponse
{
    public int PresentCount { get; set; }
    public int AbsentCount { get; set; }
    public int TotalStudentsFromSession { get; set; }
    public int AttendedCount { get; set; }
}