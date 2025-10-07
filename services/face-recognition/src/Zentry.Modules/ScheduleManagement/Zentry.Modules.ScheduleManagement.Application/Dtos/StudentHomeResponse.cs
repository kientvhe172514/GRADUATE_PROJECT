namespace Zentry.Modules.ScheduleManagement.Application.Dtos;

public class StudentHomeResponse
{
    public List<NextSessionDto> NextSessions { get; set; } = new();
    public WeeklyReviewDto WeeklyReview { get; set; } = new();
}