using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Attendance;

namespace Zentry.Modules.ScheduleManagement.Application.Features.ClassSections.GetAttendanceRateByYearAndSemester;

public record GetAttendanceRateByYearAndSemesterQuery(int Year)
    : IQuery<GetAttendanceRateByYearAndSemesterResponse>;

// Response chứa dữ liệu thống kê
public record GetAttendanceRateByYearAndSemesterResponse(Dictionary<string, double> Semesters);

// DTO tạm thời để chứa dữ liệu từ Attendance Management
public record SessionAttendanceSummary
{
    public Guid ClassSectionId { get; set; }
    public List<OverviewSessionDto> Sessions { get; set; }
    public List<OverviewAttendanceDto> AttendanceRecords { get; set; }
    public int EnrolledStudentsCount { get; set; }
}