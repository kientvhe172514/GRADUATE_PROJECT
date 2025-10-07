using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Zentry.Modules.UserManagement.Features.GetUserRequests;
using Zentry.SharedKernel.Abstractions.Models;
using Zentry.SharedKernel.Extensions;

namespace Zentry.Modules.UserManagement.Controllers;

[ApiController]
[Route("api/user-requests")]
[EnableRateLimiting("FixedPolicy")]
public class UserRequestController(IMediator mediator) : BaseController
{
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<GetUserRequestsResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetUserRequests([FromQuery] GetUserRequestsQuery query,
        CancellationToken cancellationToken)
    {
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
}