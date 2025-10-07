using Zentry.SharedKernel.Constants.Schedule;

namespace Zentry.Modules.ScheduleManagement.Application.Dtos;

public class LecturerDailyReportScheduleProjectionDto
{
    public Guid ScheduleId { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public WeekDayEnum WeekDay { get; set; }

    // From ClassSection
    public Guid ClassSectionId { get; set; }
    public string SectionCode { get; set; } = string.Empty;
    public Guid? LecturerId { get; set; }

    // From Course
    public Guid CourseId { get; set; }
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;

    // From Room
    public Guid RoomId { get; set; }
    public string RoomName { get; set; } = string.Empty;
    public string Building { get; set; } = string.Empty;
}