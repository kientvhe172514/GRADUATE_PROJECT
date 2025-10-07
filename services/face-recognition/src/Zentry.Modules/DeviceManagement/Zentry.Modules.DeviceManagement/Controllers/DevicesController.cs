using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Zentry.Modules.DeviceManagement.Features.AcceptDeviceChangeRequest;
using Zentry.Modules.DeviceManagement.Features.DeleteDevicesForInactiveStudent;
using Zentry.Modules.DeviceManagement.Features.GetDeviceById;
using Zentry.Modules.DeviceManagement.Features.GetDevices;
using Zentry.Modules.DeviceManagement.Features.GetTotalDevices;
using Zentry.Modules.DeviceManagement.Features.RegisterDevice;
using Zentry.Modules.DeviceManagement.Features.RequestDeviceChange;
using Zentry.SharedKernel.Abstractions.Models;
using Zentry.SharedKernel.Exceptions;
using Zentry.SharedKernel.Extensions;

namespace Zentry.Modules.DeviceManagement.Controllers;

[ApiController]
[Route("api/devices")]
[EnableRateLimiting("FixedPolicy")]
public class DevicesController(IMediator mediator) : BaseController
{
    [HttpPost("register")]
    [ProducesResponseType(typeof(ApiResponse<RegisterDeviceResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse),
        StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Register([FromBody] RegisterDeviceRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.AndroidId))
            return BadRequest("Android ID is required for device registration.");

        var userId = request.UserId;

        var command = new RegisterDeviceCommand
        {
            UserId = new Guid(userId),
            DeviceName = request.DeviceName,
            AndroidId = request.AndroidId,
            Platform = request.Platform,
            OsVersion = request.OsVersion,
            Model = request.Model,
            Manufacturer = request.Manufacturer,
            AppVersion = request.AppVersion,
            PushNotificationToken = request.PushNotificationToken
        };

        try
        {
            var response = await mediator.Send(command, cancellationToken);
            return HandleCreated(response, nameof(Register), new { id = response.DeviceId });
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<GetDevicesResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetDevices(
        [FromQuery] int? pageNumber,
        [FromQuery] int? pageSize,
        [FromQuery] string? searchTerm,
        [FromQuery] Guid? userId,
        [FromQuery] string? status,
        CancellationToken cancellationToken)
    {
        if (pageNumber <= 0 || pageSize <= 0)
            return BadRequest(ApiResponse.ErrorResult("VALIDATION_ERROR",
                "PageNumber and PageSize must be greater than 0."));

        var query = new GetDevicesQuery(
            pageNumber,
            pageSize,
            searchTerm,
            userId,
            status
        );

        try
        {
            var response = await mediator.Send(query, cancellationToken);
            return HandleResult(response);
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpGet("{deviceId}")]
    [ProducesResponseType(typeof(ApiResponse<GetDeviceDetailsResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetDeviceDetails(
        Guid deviceId,
        CancellationToken cancellationToken)
    {
        try
        {
            var query = new GetDeviceByIdQuery(deviceId);
            var response = await mediator.Send(query, cancellationToken);
            return HandleResult(response);
        }
        catch (NotFoundException ex)
        {
            return HandleNotFound(ex.Message, deviceId);
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpPost("request-change")]
    [ProducesResponseType(typeof(ApiResponse<RequestDeviceChangeResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RequestDeviceChange(
        [FromBody] RequestDeviceChangeCommand command,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return HandleValidationError();

        if (string.IsNullOrWhiteSpace(command.Reason))
            return BadRequest(ApiResponse.ErrorResult("VALIDATION_ERROR", "Lý do thay đổi là bắt buộc."));
        if (string.IsNullOrWhiteSpace(command.AndroidId))
            return BadRequest(ApiResponse.ErrorResult("VALIDATION_ERROR",
                "Địa chỉ Android ID của thiết bị mới là bắt buộc."));
        if (string.IsNullOrWhiteSpace(command.DeviceName))
            return BadRequest(ApiResponse.ErrorResult("VALIDATION_ERROR", "Tên thiết bị là bắt buộc."));


        try
        {
            var response = await mediator.Send(command, cancellationToken);
            return HandleResult(response);
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpPut("change-request/{userRequestId}/accept")]
    [ProducesResponseType(typeof(ApiResponse<HandleDeviceChangeRequestResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AcceptDeviceChangeRequest(
        Guid userRequestId,
        CancellationToken cancellationToken)
    {
        var command = new HandleDeviceChangeRequestCommand
        {
            UserRequestId = userRequestId,
            IsAccepted = true
        };

        try
        {
            var response = await mediator.Send(command, cancellationToken);
            return HandleResult(response);
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpPut("change-request/{userRequestId}/reject")]
    [ProducesResponseType(typeof(ApiResponse<HandleDeviceChangeRequestResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RejectDeviceChangeRequest(
        Guid userRequestId,
        CancellationToken cancellationToken)
    {
        var command = new HandleDeviceChangeRequestCommand
        {
            UserRequestId = userRequestId,
            IsAccepted = false
        };

        try
        {
            var response = await mediator.Send(command, cancellationToken);
            return HandleResult(response);
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpDelete("student/{studentId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteDevicesForInactiveStudent(Guid studentId,
        CancellationToken cancellationToken)
    {
        try
        {
            var command = new DeleteDevicesForInactiveStudentCommand { StudentId = studentId };
            await mediator.Send(command, cancellationToken);
            return HandleNoContent();
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpGet("total-devices")]
    [ProducesResponseType(typeof(ApiResponse<GetTotalDevicesResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetTotalDevices(CancellationToken cancellationToken)
    {
        try
        {
            var query = new GetTotalDevicesQuery();
            var response = await mediator.Send(query, cancellationToken);
            return HandleResult(response);
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }
}