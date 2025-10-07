namespace Zentry.Modules.ScheduleManagement.Application.Dtos;

public class WeeklyReviewDto
{
    public DateOnly WeekStart { get; set; }
    public DateOnly WeekEnd { get; set; }
    public List<WeeklyReviewCourseDto> Courses { get; set; } = new();
}