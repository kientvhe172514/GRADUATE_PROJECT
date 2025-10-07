using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Attendance;

public record GetSessionsByScheduleIdsAndDateIntegrationQuery(
    List<Guid> ScheduleIds,
    DateOnly Date
) : IQuery<GetSessionsByScheduleIdsAndDateIntegrationResponse>;

// Record đại diện cho response, chứa một Dictionary mapping từ ScheduleId sang SessionInfo
public record GetSessionsByScheduleIdsAndDateIntegrationResponse(
    Dictionary<Guid, SessionInfoForDateIntegrationResponse> SessionsByScheduleId
);

// Record đại diện cho thông tin session của một ngày
public record SessionInfoForDateIntegrationResponse(
    Guid SessionId,
    string Status,
    DateOnly StartDate,
    TimeOnly StartTime,
    TimeOnly EndTime
);