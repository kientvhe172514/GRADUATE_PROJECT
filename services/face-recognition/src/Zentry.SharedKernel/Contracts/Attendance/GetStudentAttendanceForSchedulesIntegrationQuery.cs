using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Attendance;

public record GetStudentAttendanceForSchedulesIntegrationQuery(Guid StudentId, List<Guid> ScheduleIds)
    : IQuery<GetStudentAttendanceForSchedulesIntegrationResponse>;

public class StudentAttendanceForScheduleDto
{
    public Guid ScheduleId { get; set; }
    public string Status { get; set; }
}

public record GetStudentAttendanceForSchedulesIntegrationResponse(
    List<StudentAttendanceForScheduleDto> Data);