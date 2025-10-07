namespace Zentry.Modules.ScheduleManagement.Application.Dtos;

public class ClassDetailDto
{
    public ClassOverviewDto Overview { get; set; } = null!;

    public List<SessionDetailDto> Sessions { get; set; } = new();
}