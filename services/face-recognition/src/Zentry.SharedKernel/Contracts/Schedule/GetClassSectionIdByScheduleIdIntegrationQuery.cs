using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Schedule;

public record GetClassSectionIdByScheduleIdIntegrationQuery(Guid ScheduleId)
    : IQuery<GetClassSectionIdByScheduleIdIntegrationResponse>;

public record GetClassSectionIdByScheduleIdIntegrationResponse(Guid ClassSectionId);