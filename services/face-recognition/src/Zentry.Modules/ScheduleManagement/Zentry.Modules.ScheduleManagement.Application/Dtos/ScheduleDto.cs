namespace Zentry.Modules.ScheduleManagement.Application.Dtos;

public class ScheduleDto
{
    public Guid Id { get; set; }
    public Guid ClassSectionId { get; set; }
    public string? ClassSectionCode { get; set; }
    public Guid? LecturerId { get; set; }
    public string? LecturerName { get; set; } = string.Empty;
    public Guid? CourseId { get; set; } // Có thể nullable
    public string? CourseCode { get; set; } = string.Empty;
    public string? CourseName { get; set; } = string.Empty;
    public Guid RoomId { get; set; }
    public string? RoomName { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public string WeekDay { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}