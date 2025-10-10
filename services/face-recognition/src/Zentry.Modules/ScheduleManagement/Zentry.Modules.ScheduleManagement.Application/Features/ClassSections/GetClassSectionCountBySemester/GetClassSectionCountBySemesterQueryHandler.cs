using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.ClassSections.GetClassSectionCountBySemester;

public class GetClassSectionCountBySemesterQueryHandler(
    IClassSectionRepository classSectionRepository
) : IQueryHandler<GetClassSectionCountBySemesterQuery, GetClassSectionCountBySemesterResponse>
{
    public async Task<GetClassSectionCountBySemesterResponse> Handle(GetClassSectionCountBySemesterQuery request,
        CancellationToken cancellationToken)
    {
        var yearString = request.Year.ToString().Substring(2, 2);

        // Lấy tất cả các ClassSection của năm và nhóm theo Semester
        var classSectionCountBySemester =
            await classSectionRepository.CountClassSectionsBySemestersAsync(yearString, cancellationToken);

        return new GetClassSectionCountBySemesterResponse(classSectionCountBySemester);
    }
}