using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.ClassSections.GetClassSectionCountBySemester;

public record GetClassSectionCountBySemesterQuery(int Year) : IQuery<GetClassSectionCountBySemesterResponse>;

public record GetClassSectionCountBySemesterResponse(Dictionary<string, int> Semesters);