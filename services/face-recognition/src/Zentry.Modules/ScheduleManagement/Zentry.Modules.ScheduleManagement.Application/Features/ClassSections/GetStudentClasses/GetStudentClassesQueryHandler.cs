using MediatR;
using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.Modules.ScheduleManagement.Application.Services;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Attendance;
using Zentry.SharedKernel.Contracts.User;

// Import service namespace

namespace Zentry.Modules.ScheduleManagement.Application.Features.ClassSections.GetStudentClasses;

public class GetStudentClassesQueryHandler(
    IClassSectionRepository classSectionRepository,
    IEnrollmentRepository enrollmentRepository,
    IScheduleRepository scheduleRepository,
    IAttendanceCalculationService attendanceCalculationService, // Thêm IAttendanceCalculationService
    IMediator mediator)
    : IQueryHandler<GetStudentClassesQuery, GetStudentClassesResponse>
{
    public async Task<GetStudentClassesResponse> Handle(GetStudentClassesQuery request,
        CancellationToken cancellationToken)
    {
        var enrollments = await enrollmentRepository.GetEnrollmentsByStudentIdAsync(
            request.StudentId,
            cancellationToken);

        if (enrollments.Count == 0) return new GetStudentClassesResponse { Data = new List<StudentClassDto>() };

        var classSectionIds = enrollments.Select(e => e.ClassSectionId).Distinct().ToList();

        // Lấy thông tin chi tiết của các ClassSection
        var classSections = await classSectionRepository.GetClassSectionsDetailsByIdsAsync(
            classSectionIds, cancellationToken);

        // Lấy toàn bộ schedules
        var schedules = await scheduleRepository.GetSchedulesByClassSectionIdsAsync(classSectionIds, cancellationToken);

        var lecturerIds = classSections.Where(cs => cs.LecturerId.HasValue).Select(cs => cs.LecturerId!.Value)
            .Distinct().ToList();
        var lecturers = new Dictionary<Guid, string>();
        if (lecturerIds.Count != 0)
        {
            var usersResponse = await mediator.Send(new GetUsersByIdsIntegrationQuery(lecturerIds), cancellationToken);
            lecturers = usersResponse.Users.ToDictionary(u => u.Id, u => u.FullName ?? "N/A");
        }

        // Tạo dictionary để ánh xạ từ ScheduleId sang ClassSectionId
        var scheduleToClassSectionMap = schedules.ToDictionary(s => s.Id, s => s.ClassSectionId);
        var scheduleIds = scheduleToClassSectionMap.Keys.ToList();

        // Lấy dữ liệu attendance cho tất cả schedules
        var classAttendanceData = await mediator.Send(
            new GetStudentAttendanceForSchedulesIntegrationQuery(request.StudentId, scheduleIds),
            cancellationToken);

        var studentClasses = new List<StudentClassDto>();

        foreach (var classSection in classSections)
        {
            // Lấy các scheduleId thuộc về classSection hiện tại
            var schedulesOfClass = schedules.Where(s => s.ClassSectionId == classSection.Id).ToList();
            var scheduleIdsOfClass = schedulesOfClass.Select(s => s.Id).ToList();

            // Lấy các bản ghi điểm danh thuộc về classSection này
            var attendanceRecordsOfClass = classAttendanceData.Data
                .Where(ar => scheduleIdsOfClass.Contains(ar.ScheduleId))
                .ToList();

            // Tính toán tỷ lệ điểm danh bằng cách gọi service
            var attendanceRate = attendanceCalculationService.CalculateAttendanceRateForStudent(
                schedulesOfClass,
                attendanceRecordsOfClass);

            var lecturerName = classSection.LecturerId.HasValue
                ? lecturers.GetValueOrDefault(classSection.LecturerId.Value, "N/A")
                : "N/A";

            studentClasses.Add(new StudentClassDto
            {
                ClassId = classSection.Id,
                CourseName = classSection.Course?.Name,
                CourseCode = classSection.Course?.Code,
                SectionCode = classSection.SectionCode,
                ClassName = $"{classSection.Course?.Name} - {classSection.SectionCode}",
                LecturerName = lecturerName,
                LecturerId = classSection.LecturerId,
                AttendanceRate = Math.Round(attendanceRate, 1)
            });
        }

        return new GetStudentClassesResponse { Data = studentClasses };
    }
}