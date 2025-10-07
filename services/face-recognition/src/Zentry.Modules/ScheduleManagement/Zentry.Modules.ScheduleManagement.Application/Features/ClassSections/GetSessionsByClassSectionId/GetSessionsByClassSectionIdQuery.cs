using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.ClassSections.GetSessionsByClassSectionId;

public record GetSessionsByClassSectionIdQuery(Guid ClassSectionId) : IQuery<GetSessionsByClassSectionIdResponse>;

public record GetSessionsByClassSectionIdResponse(List<SessionDto> Sessions);