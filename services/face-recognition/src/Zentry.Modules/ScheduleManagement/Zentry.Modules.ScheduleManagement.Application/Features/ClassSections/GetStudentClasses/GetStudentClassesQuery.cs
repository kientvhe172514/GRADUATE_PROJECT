using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.ClassSections.GetStudentClasses;

public class GetStudentClassesQuery : IQuery<GetStudentClassesResponse>
{
    public Guid StudentId { get; set; }
}

public class GetStudentClassesResponse
{
    public List<StudentClassDto> Data { get; set; } = new();
}