using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Attendance;

public record GetStudentAttendanceStatusForSessionsIntegrationQuery(
    Guid StudentId,
    List<Guid> SessionIds)
    : IQuery<GetStudentAttendanceStatusForSessionsIntegrationResponse>;

public record GetStudentAttendanceStatusForSessionsIntegrationResponse(
    List<StudentAttendanceStatusDto> AttendanceStatus);

public record StudentAttendanceStatusDto
{
    public Guid SessionId { get; set; }
    public string Status { get; set; } = string.Empty;
}