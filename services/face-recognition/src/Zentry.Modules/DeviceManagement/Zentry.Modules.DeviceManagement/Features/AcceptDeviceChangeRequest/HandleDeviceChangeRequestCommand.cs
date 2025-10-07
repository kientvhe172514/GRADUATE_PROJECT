using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.DeviceManagement.Features.AcceptDeviceChangeRequest;

public class HandleDeviceChangeRequestCommand : ICommand<HandleDeviceChangeRequestResponse>
{
    public Guid UserRequestId { get; set; }
    public bool IsAccepted { get; set; }
}

public class HandleDeviceChangeRequestResponse
{
    public Guid UpdatedDeviceId { get; set; }
    public Guid? DeactivatedDeviceId { get; set; }
    public Guid UserRequestId { get; set; }
    public string Message { get; set; } = string.Empty;
}