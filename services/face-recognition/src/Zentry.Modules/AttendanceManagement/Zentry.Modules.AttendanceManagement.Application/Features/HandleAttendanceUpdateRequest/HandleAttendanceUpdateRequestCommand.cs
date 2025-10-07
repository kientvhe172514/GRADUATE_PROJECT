using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.AttendanceManagement.Application.Features.HandleAttendanceUpdateRequest;

public class HandleAttendanceUpdateRequestCommand : ICommand<HandleAttendanceUpdateRequestResponse>
{
    public Guid UserRequestId { get; set; }
    public bool IsAccepted { get; set; }
}

public class HandleAttendanceUpdateRequestResponse
{
    public Guid AttendanceRecordId { get; set; }
    public Guid UserRequestId { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? UpdatedStatus { get; set; }
}