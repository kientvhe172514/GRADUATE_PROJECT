using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Zentry.Modules.UserManagement.Features.ResetPassword;
using Zentry.Modules.UserManagement.Features.SignIn;
using Zentry.Modules.UserManagement.Features.UpdatePassword;
using Zentry.SharedKernel.Abstractions.Models;
using Zentry.SharedKernel.Extensions;

namespace Zentry.Modules.UserManagement.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("FixedPolicy")]
public class AuthController(IMediator mediator) : BaseController
{
    [HttpPost("sign-in")]
    [ProducesResponseType(typeof(ApiResponse<SignInResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> SignIn([FromBody] SignInCommand command)
    {
        if (!ModelState.IsValid)
            return HandleValidationError();

        try
        {
            var result = await mediator.Send(command);
            return HandleResult(result, "User signed in successfully.");
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpPost("reset-password/request")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RequestResetPassword([FromBody] RequestResetPasswordCommand command)
    {
        try
        {
            await mediator.Send(command);
            // Trả về thông báo thành công chung để tránh lộ thông tin tài khoản
            return HandleResult("Password reset email sent if account exists.");
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpPost("reset-password/confirm")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ConfirmResetPassword([FromBody] ConfirmResetPasswordCommand command)
    {
        if (!ModelState.IsValid) return HandleValidationError();
        try
        {
            await mediator.Send(command);
            return HandleResult("Password has been reset successfully.");
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpPut("{id}/password")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdatePassword(Guid id, [FromBody] UpdatePasswordRequest request)
    {
        var command = new UpdatePasswordCommand(id, request.NewPassword);
        try
        {
            await mediator.Send(command);
            return HandleNoContent();
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }
}