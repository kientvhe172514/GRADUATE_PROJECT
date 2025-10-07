using MediatR;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.DeviceManagement.Features.DeleteDevicesForInactiveStudent;

public class DeleteDevicesForInactiveStudentCommand : ICommand<Unit>
{
    public Guid StudentId { get; set; }
}