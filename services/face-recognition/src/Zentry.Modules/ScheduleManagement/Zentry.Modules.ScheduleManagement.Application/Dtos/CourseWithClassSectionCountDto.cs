namespace Zentry.Modules.ScheduleManagement.Application.Dtos;

public class CourseWithClassSectionCountDto
{
    public Guid CourseId { get; set; }
    public string CourseName { get; set; }
    public int ClassSectionCount { get; set; }
}