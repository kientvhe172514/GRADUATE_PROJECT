using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.ClassSections.GetTotalClassSectionCount;

public class GetTotalClassSectionCountQueryHandler(IClassSectionRepository classSectionRepository)
    : IQueryHandler<GetTotalClassSectionCountQuery, int>
{
    public async Task<int> Handle(GetTotalClassSectionCountQuery request, CancellationToken cancellationToken)
    {
        return await classSectionRepository.CountTotalClassSectionsAsync(cancellationToken);
    }
}