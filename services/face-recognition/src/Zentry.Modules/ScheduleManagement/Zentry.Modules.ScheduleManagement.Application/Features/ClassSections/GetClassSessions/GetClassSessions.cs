using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.ClassSections.GetClassSessions;

public class GetClassSessionsQuery : IQuery<GetClassSessionsResponse>
{
    public Guid ClassId { get; set; }
}

public class GetClassSessionsResponse
{
    public List<SessionDetailDto> Data { get; set; } = new();
}