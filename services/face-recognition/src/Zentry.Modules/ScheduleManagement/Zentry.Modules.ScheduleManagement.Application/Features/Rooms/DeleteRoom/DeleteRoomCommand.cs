using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Rooms.DeleteRoom;

public record DeleteRoomCommand(Guid Id) : ICommand<bool>;