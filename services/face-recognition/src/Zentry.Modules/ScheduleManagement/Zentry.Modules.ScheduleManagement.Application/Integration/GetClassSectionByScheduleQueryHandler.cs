using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Schedule;

namespace Zentry.Modules.ScheduleManagement.Application.Integration;

public class GetClassSectionByScheduleQueryHandler(IClassSectionRepository classSectionRepository)
    : IQueryHandler<GetClassSectionByScheduleIdIntegrationQuery, GetClassSectionByScheduleIdIntegrationResponse>
{
    public async Task<GetClassSectionByScheduleIdIntegrationResponse> Handle(
        GetClassSectionByScheduleIdIntegrationQuery request,
        CancellationToken cancellationToken)
    {
        var classSection = await classSectionRepository.GetByScheduleIdAsync(request.ScheduleId, cancellationToken);

        if (classSection is null)
            return new GetClassSectionByScheduleIdIntegrationResponse
            {
                ClassSectionId = Guid.Empty,
                CourseId = Guid.Empty,
                CourseCode = string.Empty,
                CourseName = string.Empty,
                SectionCode = string.Empty
            };

        return new GetClassSectionByScheduleIdIntegrationResponse
        {
            ClassSectionId = classSection.Id,
            CourseId = classSection.Course?.Id ?? Guid.Empty,
            CourseCode = classSection.Course?.Code ?? string.Empty,
            CourseName = classSection.Course?.Name ?? string.Empty,
            SectionCode = classSection.SectionCode
        };
    }
}