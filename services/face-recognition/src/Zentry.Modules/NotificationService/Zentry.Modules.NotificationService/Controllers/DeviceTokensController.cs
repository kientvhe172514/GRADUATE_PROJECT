using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Zentry.Modules.NotificationService.Features.RegisterFcmToken;
using Zentry.SharedKernel.Abstractions.Models;
using Zentry.SharedKernel.Extensions;

namespace Zentry.Modules.NotificationService.Controllers;

/// <summary>
///     Controller để quản lý device tokens và FCM registration
/// </summary>
[ApiController]
[Route("api/device-tokens")]
public class DeviceTokensController : BaseController
{
    private readonly IMediator _mediator;

    public DeviceTokensController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    ///     Đăng ký FCM token cho device
    /// </summary>
    /// <param name="request">Thông tin đăng ký FCM token</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Kết quả đăng ký</returns>
    [HttpPost("register-fcm")]
    [ProducesResponseType(typeof(ApiResponse<RegisterFcmTokenResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> RegisterFcmToken(
        [FromBody] RegisterFcmTokenRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Validate request
            if (string.IsNullOrWhiteSpace(request.FcmToken))
                return HandleBadRequest("VALIDATION_ERROR", "FCM Token is required");

            if (string.IsNullOrWhiteSpace(request.AndroidId))
                return HandleBadRequest("VALIDATION_ERROR", "Android ID is required");

            if (string.IsNullOrWhiteSpace(request.Platform))
                return HandleBadRequest("VALIDATION_ERROR", "Platform is required");

            // Create command
            var command = new RegisterFcmTokenCommand(
                request.UserId,
                request.AndroidId,
                request.FcmToken,
                request.Platform,
                request.DeviceName,
                request.Model,
                request.Manufacturer,
                request.OsVersion,
                request.AppVersion);

            // Execute command
            var result = await _mediator.Send(command, cancellationToken);

            return HandleResult(result);
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    /// <summary>
    ///     Kiểm tra trạng thái FCM token
    /// </summary>
    /// <param name="userId">ID của user</param>
    /// <param name="androidId">Android ID của device</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Trạng thái FCM token</returns>
    [HttpGet("fcm-status")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetFcmTokenStatus(
        [FromQuery] Guid userId,
        [FromQuery] string androidId,
        CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(androidId))
                return HandleBadRequest("VALIDATION_ERROR", "Android ID is required");

            // TODO: Implement FCM token status check
            // For now, return basic info
            var response = new
            {
                UserId = userId,
                AndroidId = androidId,
                HasFcmToken = false, // TODO: Check from DeviceManagement
                LastUpdated = (DateTime?)null,
                Status = "Not Implemented"
            };

            return HandleResult(response);
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }
}