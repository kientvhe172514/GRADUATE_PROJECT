namespace Zentry.Modules.ScheduleManagement.Application.Dtos;

public class ClassSectionWithEnrollmentCountDto
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public Guid? LecturerId { get; set; }
    public string SectionCode { get; set; } = string.Empty;
    public string Semester { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public int EnrolledStudentsCount { get; set; } // Số lượng sinh viên đã đăng ký

    // Có thể thêm các thông tin khác nếu cần, ví dụ: LecturerName
    public string LecturerName { get; set; } = string.Empty;
}