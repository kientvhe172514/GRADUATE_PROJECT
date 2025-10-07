// File: Zentry.Modules.ScheduleManagement.Application.Dtos/StudentDailyClassDto.cs

public class StudentDailyClassDto
{
    public Guid ScheduleId { get; set; }
    public Guid ClassSectionId { get; set; }

    public Guid CourseId { get; set; }
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;

    public string SectionCode { get; set; } = string.Empty;

    public Guid? LecturerId { get; set; }
    public string? LecturerName { get; set; } = string.Empty;

    public Guid RoomId { get; set; }
    public string RoomName { get; set; } = string.Empty;
    public string Building { get; set; } = string.Empty;

    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public string Weekday { get; set; }
    public DateOnly DateInfo { get; set; }

    // Thông tin về buổi học (session) của ngày hiện tại
    public Guid? SessionId { get; set; } // Có thể null nếu chưa có session
    public string SessionStatus { get; set; } = string.Empty;

    // Trạng thái điểm danh của sinh viên cho session này
    public string StudentAttendanceStatus { get; set; } = string.Empty; // Ví dụ: Present, Late, Absent, N/A
}