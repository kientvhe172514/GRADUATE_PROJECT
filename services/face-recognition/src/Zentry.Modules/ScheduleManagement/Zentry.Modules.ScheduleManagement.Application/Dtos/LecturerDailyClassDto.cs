namespace Zentry.Modules.ScheduleManagement.Application.Dtos;

public class LecturerDailyClassDto
{
    public Guid ScheduleId { get; set; }
    public Guid ClassSectionId { get; set; }

    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;

    public string SectionCode { get; set; } = string.Empty;

    public string Weekday { get; set; } = string.Empty;
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }

    public string RoomName { get; set; } = string.Empty;
    public string Building { get; set; } = string.Empty;

    public string SessionStatus { get; set; } = string.Empty;
    public Guid? SessionId { get; set; }
}