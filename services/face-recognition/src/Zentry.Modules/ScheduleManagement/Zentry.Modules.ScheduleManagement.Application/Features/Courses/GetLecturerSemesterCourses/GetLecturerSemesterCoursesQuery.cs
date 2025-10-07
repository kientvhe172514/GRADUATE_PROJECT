using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Courses.GetLecturerSemesterCourses;

public class GetLecturerSemesterCoursesQuery : IQuery<GetLecturerSemesterCoursesResponse>
{
    public Guid LecturerId { get; set; }
    public string Semester { get; set; } = string.Empty;
}

public class GetLecturerSemesterCoursesResponse
{
    public List<SemesterCourseDto> SemesterCourses { get; set; } = new();
}