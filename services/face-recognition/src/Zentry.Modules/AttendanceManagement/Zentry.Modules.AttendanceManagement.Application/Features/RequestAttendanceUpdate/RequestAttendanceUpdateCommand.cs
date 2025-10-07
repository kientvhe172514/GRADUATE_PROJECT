using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.AttendanceManagement.Application.Features.RequestAttendanceUpdate;

public class RequestAttendanceUpdateCommand : ICommand<RequestAttendanceUpdateResponse>
{
    public Guid StudentId { get; set; }
    public Guid SessionId { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class RequestAttendanceUpdateResponse
{
    public Guid UserRequestId { get; set; }
    public string Message { get; set; } = string.Empty;
}