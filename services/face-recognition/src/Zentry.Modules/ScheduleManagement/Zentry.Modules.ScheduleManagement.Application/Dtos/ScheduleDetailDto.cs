namespace Zentry.Modules.ScheduleManagement.Application.Dtos;

public class ScheduleDetailDto
{
    public Guid ScheduleId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public string WeekDay { get; set; } = string.Empty;

    // Thông tin từ ClassSection
    public Guid ClassSectionId { get; set; }
    public string SectionCode { get; set; } = string.Empty;

    // Thông tin từ Course
    public string CourseName { get; set; } = string.Empty;

    // Thông tin từ Room
    public Guid RoomId { get; set; }
    public string RoomName { get; set; } = string.Empty;
    public string Building { get; set; } = string.Empty;

    // Các trường đã được bổ sung
    public int EnrolledStudentsCount { get; set; }
    public int DurationInMinutes { get; set; }
    public string? SessionStatus { get; set; }
}