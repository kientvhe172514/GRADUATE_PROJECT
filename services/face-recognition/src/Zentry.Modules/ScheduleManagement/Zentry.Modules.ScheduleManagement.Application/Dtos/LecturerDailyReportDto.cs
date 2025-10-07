namespace Zentry.Modules.ScheduleManagement.Application.Dtos;

public class LecturerDailyReportDto
{
    // ID của Giảng viên
    public Guid LecturerId { get; set; } // <-- Thêm ID này
    public string LecturerName { get; set; } = string.Empty;

    // ID của ClassSection
    public Guid ClassSectionId { get; set; } // <-- Thêm ID này

    // ID của Course
    public Guid CourseId { get; set; } // <-- Thêm ID này
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;

    public string SectionCode { get; set; } = string.Empty;

    // ID của Room
    public Guid RoomId { get; set; } // <-- Thêm ID này
    public string RoomInfo { get; set; } = string.Empty;

    // ID của Schedule (Lịch trình)
    public Guid ScheduleId { get; set; } // <-- Thêm ID này
    public string TimeSlot { get; set; } = string.Empty;

    // ID của Session (nếu báo cáo này là cho một session cụ thể trong ngày)
    // Nếu mỗi lịch trình chỉ có 1 session duy nhất trong ngày, thì có thể thêm SessionId ở đây.
    // Nếu một lịch trình có thể có nhiều sessions trong một ngày (ít phổ biến), bạn cần List<SessionId> hoặc DTO riêng.
    // Trong ngữ cảnh "Daily Report" thường là tổng hợp cho một ngày, nên có thể không cần SessionId cụ thể ở đây
    // Nếu cần, bạn phải bổ sung cách lấy nó trong handler.
    // public Guid? SessionId { get; set; } // <-- Tùy chọn, nếu bạn muốn chỉ rõ SessionId nào đang được báo cáo

    public int TotalStudents { get; set; }
    public int AttendedStudents { get; set; }
    public int PresentStudents { get; set; }
    public int LateStudents { get; set; }
    public int AbsentStudents { get; set; }
    public string AttendanceRate { get; set; } = string.Empty;
    public string OnTimeRate { get; set; } = string.Empty;

    // Ngày của báo cáo
    public DateOnly ReportDate { get; set; } // <-- Thêm ngày của báo cáo
}