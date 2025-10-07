using MediatR;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.AttendanceManagement.Application.Features.CancelSession;

public class CancelSessionCommand : ICommand<Unit>
{
    public Guid SessionId { get; set; }
}