using MediatR;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.AttendanceManagement.Application.Features.DeleteSession;

public class DeleteSessionCommand : ICommand<Unit>
{
    public Guid SessionId { get; set; }
}