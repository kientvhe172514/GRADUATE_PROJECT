using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Schedule;

public record GetRoomInfoByScheduleIdIntegrationQuery(Guid ScheduleId)
    : IQuery<GetRoomInfoByScheduleIdIntegrationResponse>;

public record GetRoomInfoByScheduleIdIntegrationResponse(string RoomInfo, Guid RoomId);