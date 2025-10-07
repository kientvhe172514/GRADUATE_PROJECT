using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Attendance;

public record GetStudentWeeklyOverviewIntegrationQuery(
    Guid StudentId,
    List<Guid> ScheduleIds,
    DateTime StartOfWeekUtc,
    DateTime EndOfWeekUtc)
    : IQuery<GetStudentWeeklyOverviewIntegrationResponse>;

public record GetStudentWeeklyOverviewIntegrationResponse(
    List<OverviewSessionDto> Sessions,
    List<OverviewAttendanceDto> AttendanceRecords);