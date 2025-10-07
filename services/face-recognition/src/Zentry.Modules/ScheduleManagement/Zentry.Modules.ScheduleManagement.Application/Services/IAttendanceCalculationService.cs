using Zentry.Modules.ScheduleManagement.Domain.Entities;
using Zentry.SharedKernel.Contracts.Attendance;

namespace Zentry.Modules.ScheduleManagement.Application.Services;

public interface IAttendanceCalculationService
{
    double CalculateAttendanceRate(
        List<OverviewSessionDto> classSessions,
        List<OverviewAttendanceDto> classAttendanceRecords,
        int enrolledStudentsCount);

    double CalculateAttendanceRateForStudent(
        List<Schedule> schedules,
        List<StudentAttendanceForScheduleDto> attendanceRecords);
}