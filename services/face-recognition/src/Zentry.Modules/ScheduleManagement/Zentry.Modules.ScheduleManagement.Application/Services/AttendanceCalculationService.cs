using Zentry.Modules.ScheduleManagement.Domain.Entities;
using Zentry.SharedKernel.Constants.Attendance;
using Zentry.SharedKernel.Contracts.Attendance;

namespace Zentry.Modules.ScheduleManagement.Application.Services;

public class AttendanceCalculationService : IAttendanceCalculationService
{
    public double CalculateAttendanceRate(
        List<OverviewSessionDto> classSessions,
        List<OverviewAttendanceDto> classAttendanceRecords,
        int enrolledStudentsCount)
    {
        var completedSessionIds = classSessions
            .Where(s => s.Status.Equals(SessionStatus.Completed.ToString(), StringComparison.CurrentCultureIgnoreCase))
            .Select(s => s.Id)
            .ToList();

        if (enrolledStudentsCount == 0 || completedSessionIds.Count == 0) return 0;

        var totalPresentCount = classAttendanceRecords
            .Count(ar =>
                completedSessionIds.Contains(ar.SessionId) && ar.Status == AttendanceStatus.Present.ToString());

        var totalExpectedPresentCount = enrolledStudentsCount * completedSessionIds.Count;

        if (totalExpectedPresentCount == 0) return 0;

        return (double)totalPresentCount / totalExpectedPresentCount * 100;
    }

    public double CalculateAttendanceRateForStudent(
        List<Schedule> schedules,
        List<StudentAttendanceForScheduleDto> attendanceRecords)
    {
        var totalSessionsOfClass = schedules.Count;
        var attendedCount = attendanceRecords.Count(ar => ar.Status == AttendanceStatus.Present.ToString());

        if (totalSessionsOfClass == 0) return 0;

        return (double)attendedCount / totalSessionsOfClass * 100;
    }
}