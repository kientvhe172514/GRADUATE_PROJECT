using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Rooms.GetRoomById;

public record GetRoomByIdQuery(Guid Id) : IQuery<RoomDto>;