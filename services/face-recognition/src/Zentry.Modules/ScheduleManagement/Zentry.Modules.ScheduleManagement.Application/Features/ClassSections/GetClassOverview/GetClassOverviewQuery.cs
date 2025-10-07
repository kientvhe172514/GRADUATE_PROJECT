using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.ClassSections.GetClassOverview;

public class GetClassOverviewQuery : IQuery<GetClassOverviewResponse>
{
    public Guid ClassId { get; set; }
}

public class GetClassOverviewResponse
{
    public ClassOverviewDto Data { get; set; } = null!;
}