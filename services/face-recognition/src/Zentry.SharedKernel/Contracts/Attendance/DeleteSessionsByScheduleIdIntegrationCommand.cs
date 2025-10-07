using MediatR;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Attendance;

public class DeleteSessionsByScheduleIdIntegrationCommand : ICommand<Unit>
{
    public Guid ScheduleId { get; init; }
}