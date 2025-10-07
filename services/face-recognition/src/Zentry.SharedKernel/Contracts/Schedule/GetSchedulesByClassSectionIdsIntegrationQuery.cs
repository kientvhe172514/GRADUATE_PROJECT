using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Schedule;

public record GetSchedulesByClassSectionIdsIntegrationQuery(List<Guid> ClassSectionIds)
    : IQuery<GetSchedulesByClassSectionIdsIntegrationResponse>;

public record ScheduleRoomInfoDto(Guid Id, string RoomInfo);

public record GetSchedulesByClassSectionIdsIntegrationResponse(List<ScheduleRoomInfoDto> Schedules);