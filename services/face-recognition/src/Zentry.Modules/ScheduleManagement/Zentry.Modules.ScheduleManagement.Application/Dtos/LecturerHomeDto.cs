namespace Zentry.Modules.ScheduleManagement.Application.Dtos;

public class LecturerHomeDto
{
    public Guid ClassSectionId { get; set; }
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;

    public Guid CourseId { get; set; }

    public string SectionCode { get; set; } = string.Empty;
    public int EnrolledStudents { get; set; }
    public int TotalSessions { get; set; }
    public string? SessionProgress { get; set; }
    public List<ScheduleInfoDto> Schedules { get; set; } = [];
    public string? LecturerName { get; set; }

    public Guid LecturerId { get; set; }
}

public class ScheduleInfoDto
{
    public Guid ScheduleId { get; set; }

    public Guid RoomId { get; set; }

    public string RoomInfo { get; set; } = string.Empty;
    public string ScheduleInfo { get; set; } = string.Empty;
}