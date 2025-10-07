using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Schedule;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ScheduleManagement.Application.Integration;

public class GetSectionCodeIntegrationQueryHandler(IClassSectionRepository classSectionRepository)
    : IQueryHandler<GetSectionCodeIntegrationQuery, GetSectionCodeIntegrationResponse>
{
    public async Task<GetSectionCodeIntegrationResponse> Handle(GetSectionCodeIntegrationQuery request,
        CancellationToken cancellationToken)
    {
        var classSection = await classSectionRepository.GetByIdAsync(request.ClassSectionId, cancellationToken);
        if (classSection is null) throw new NotFoundException("ClassSection", request.ClassSectionId);

        return new GetSectionCodeIntegrationResponse(classSection.SectionCode);
    }
}