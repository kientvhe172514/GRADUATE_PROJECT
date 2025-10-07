using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.Modules.ScheduleManagement.Application.Features.Rooms.CreateRoom;
using Zentry.Modules.ScheduleManagement.Application.Features.Rooms.DeleteRoom;
using Zentry.Modules.ScheduleManagement.Application.Features.Rooms.GetRoomById;
using Zentry.Modules.ScheduleManagement.Application.Features.Rooms.GetRooms;
using Zentry.Modules.ScheduleManagement.Application.Features.Rooms.GetTotalRoomCount;
using Zentry.Modules.ScheduleManagement.Application.Features.Rooms.UpdateRoom;
using Zentry.SharedKernel.Abstractions.Models;
using Zentry.SharedKernel.Extensions;

namespace Zentry.Modules.ScheduleManagement.Presentation.Controllers;

[ApiController]
[Route("api/rooms")]
[EnableRateLimiting("FixedPolicy")]
public class RoomsController(IMediator mediator) : BaseController
{
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<GetRoomsResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetRooms([FromQuery] GetRoomsQuery query, CancellationToken cancellationToken)
    {
        try
        {
            var response = await mediator.Send(query, cancellationToken);
            return HandleResult(response, "Rooms retrieved successfully.");
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<RoomDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRoomById(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var query = new GetRoomByIdQuery(id);
            var response = await mediator.Send(query, cancellationToken);
            return response == null
                ? HandleNotFound("Room", id)
                : HandleResult(response, "Room retrieved successfully.");
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<CreateRoomResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateRoom([FromBody] CreateRoomRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var response =
                await mediator.Send(new CreateRoomCommand(request.RoomName, request.Building),
                    cancellationToken);
            return HandleCreated(response, nameof(CreateRoom), new { id = response.Id });
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<RoomDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateRoom(Guid id, [FromBody] UpdateRoomRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var command = new UpdateRoomCommand(id, request);
            var response = await mediator.Send(command, cancellationToken);
            return HandleResult(response, "Room updated successfully.");
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteRoom(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var command = new DeleteRoomCommand(id);
            await mediator.Send(command, cancellationToken);
            return HandleNoContent();
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpGet("total-rooms")]
    public async Task<IActionResult> GetTotalRooms(CancellationToken cancellationToken)
    {
        try
        {
            var count = await mediator.Send(new GetTotalRoomCountQuery(), cancellationToken);
            return HandleResult(count);
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }
}