using MediatR;
using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.Modules.ScheduleManagement.Application.Services;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Attendance;

namespace Zentry.Modules.ScheduleManagement.Application.Features.ClassSections.GetAttendanceRateByYearAndSemester;

public class GetAttendanceRateByYearAndSemesterQueryHandler(
    IClassSectionRepository classSectionRepository,
    IScheduleRepository scheduleRepository,
    IAttendanceCalculationService attendanceCalculationService,
    IMediator mediator
) : IQueryHandler<GetAttendanceRateByYearAndSemesterQuery, GetAttendanceRateByYearAndSemesterResponse>
{
    public async Task<GetAttendanceRateByYearAndSemesterResponse> Handle(
        GetAttendanceRateByYearAndSemesterQuery request,
        CancellationToken cancellationToken)
    {
        var yearString = request.Year.ToString().Substring(2, 2);

        var classSectionsInYear =
            await classSectionRepository.GetClassSectionsByYearAsync(yearString, cancellationToken);

        if (!classSectionsInYear.Any())
            return new GetAttendanceRateByYearAndSemesterResponse(new Dictionary<string, double>());

        var classSectionIds = classSectionsInYear.Select(cs => cs.Id).ToList();

        // 2. Lấy toàn bộ Schedule của các ClassSection đó
        var schedules = await scheduleRepository.GetSchedulesByClassSectionIdsAsync(classSectionIds, cancellationToken);
        var scheduleIds = schedules.Select(s => s.Id).ToList();

        // 3. Gửi Integration Query tới AttendanceManagement để lấy dữ liệu điểm danh
        var attendanceData = await mediator.Send(
            new GetAttendanceDataByScheduleIdsIntegrationQuery(scheduleIds),
            cancellationToken);

        var attendanceDataDict = attendanceData.ToDictionary(a => a.ScheduleId);

        var attendanceRates = new Dictionary<string, double>();

        // 4. Nhóm các Schedule theo Semester và tính toán tỷ lệ
        var groupedBySemester = schedules.GroupBy(s => s.ClassSection!.Semester.Value);

        foreach (var group in groupedBySemester)
        {
            var semester = group.Key;
            var semesterRates = new List<double>();

            // Tính tỷ lệ cho mỗi ClassSection trong kỳ
            var schedulesByClassSection = group.GroupBy(s => s.ClassSectionId);
            foreach (var classGroup in schedulesByClassSection)
            {
                var classSchedules = classGroup.ToList();

                // Lấy số sinh viên đã đăng ký
                var enrolledStudentsCount = classGroup.First().ClassSection!.Enrollments.Count;

                // Lấy dữ liệu điểm danh
                var classAttendanceRecords = new List<OverviewAttendanceDto>();
                foreach (var schedule in classSchedules)
                    if (attendanceDataDict.TryGetValue(schedule.Id, out var data))
                        classAttendanceRecords.AddRange(data.AttendanceRecords);

                // Cần một DTO cho sessions tương ứng từ schedules
                var sessionDtos = classSchedules
                    .Select(s => new OverviewSessionDto { Id = s.Id, ScheduleId = s.Id, Status = "Completed" })
                    .ToList();

                var rate = attendanceCalculationService.CalculateAttendanceRate(
                    sessionDtos,
                    classAttendanceRecords,
                    enrolledStudentsCount);

                semesterRates.Add(rate);
            }

            // Tính tỷ lệ trung bình cho kỳ
            var averageRate = semesterRates.Any() ? semesterRates.Average() : 0.0;
            attendanceRates[semester] = Math.Round(averageRate, 2);
        }

        return new GetAttendanceRateByYearAndSemesterResponse(attendanceRates);
    }
}