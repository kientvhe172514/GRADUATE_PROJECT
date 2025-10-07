namespace Zentry.Modules.AttendanceManagement.Application.Dtos;

public class FinalAttendanceDto
{
    public Guid StudentId { get; set; }
    public string? StudentCode { get; set; }
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string? AttendanceStatus { get; set; }

    public Guid EnrollmentId { get; set; }
    public DateTime EnrolledAt { get; set; }
    public string? EnrollmentStatus { get; set; }
    public Guid SessionId { get; set; }
    public Guid ClassSectionId { get; set; }
    public Guid ScheduleId { get; set; }
    public Guid CourseId { get; set; }
    public string? ClassInfo { get; set; }
    public DateTime SessionStartTime { get; set; }
}