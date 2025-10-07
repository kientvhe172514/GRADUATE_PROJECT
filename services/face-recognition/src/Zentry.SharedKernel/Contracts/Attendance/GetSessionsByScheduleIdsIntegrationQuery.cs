using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Attendance;

public record GetSessionsByScheduleIdsIntegrationQuery(List<Guid> ScheduleIds)
    : IQuery<GetSessionsByScheduleIdsIntegrationResponse>;

public record GetSessionsByScheduleIdsIntegrationResponse(List<SessionDetailIntegrationResponse> Data);

public record SessionDetailIntegrationResponse(
    Guid SessionId,
    string Status,
    int SessionNumber,
    DateOnly SessionDate,
    TimeOnly SessionTime,
    TimeOnly EndTime,
    Guid ScheduleId,
    List<AttendanceRecordIntegrationResponse> AttendanceRecords
);

public record AttendanceRecordIntegrationResponse(
    Guid RecordId,
    Guid StudentId,
    string Status
);