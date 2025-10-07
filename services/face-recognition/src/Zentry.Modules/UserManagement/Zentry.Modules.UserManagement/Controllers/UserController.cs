using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Zentry.Modules.UserManagement.Dtos;
using Zentry.Modules.UserManagement.Features.CreateUser;
using Zentry.Modules.UserManagement.Features.DeleteUser;
using Zentry.Modules.UserManagement.Features.GetUser;
using Zentry.Modules.UserManagement.Features.GetUsers;
using Zentry.Modules.UserManagement.Features.ImportUsers;
using Zentry.Modules.UserManagement.Features.UpdateUser;
using Zentry.Modules.UserManagement.Features.UpdateUserStatus;
using Zentry.SharedKernel.Abstractions.Data;
using Zentry.SharedKernel.Abstractions.Models;
using Zentry.SharedKernel.Constants.Response;
using Zentry.SharedKernel.Exceptions;
using Zentry.SharedKernel.Extensions;

namespace Zentry.Modules.UserManagement.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("FixedPolicy")]
public class UserController(IMediator mediator, IFileProcessor<UserImportDto> fileProcessor) : BaseController
{
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<GetUsersResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetUsers([FromQuery] GetUsersQuery query)
    {
        try
        {
            var response = await mediator.Send(query);
            return HandleResult(response);
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<GetUserResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetUserDetail(Guid id)
    {
        var query = new GetUserQuery(id);

        try
        {
            var response = await mediator.Send(query);

            return HandleResult(response);
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<CreateUserResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
    {
        var command = new CreateUserCommand(request);

        try
        {
            var response = await mediator.Send(command);

            if (response.SkippedAttributes.Count == 0)
                return HandleCreated(response, nameof(GetUserDetail), new { id = response.UserId });
            var skippedKeys = string.Join(", ", response.SkippedAttributes);
            var message = $"Đã tạo user thành công, nhưng một số thuộc tính sau không hợp lệ: {skippedKeys}";

            return HandlePartialSuccess(response, message);
        }
        catch (ResourceNotFoundException ex)
        {
            return HandleConflict(ErrorCodes.UserAlreadyExists, ex.Message);
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<UpdateUserResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserRequest request)
    {
        var command = new UpdateUserCommand(id, request);

        try
        {
            var response = await mediator.Send(command);

            if (response.Success) return HandleResult(response);
            if (response.Message?.Contains("User not found") == true)
                return NotFound(ApiResponse.ErrorResult(ErrorCodes.UserNotFound, response.Message));

            if (response.Message?.Contains("Associated account not found") == true ||
                response.Message?.Contains("Account not found") == true)
                return NotFound(ApiResponse.ErrorResult(ErrorCodes.AccountNotFound, response.Message));

            return response.Message != null
                ? BadRequest(ApiResponse.ErrorResult(ErrorCodes.BusinessLogicError, response.Message))
                : HandleResult(response);
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse<DeleteUserResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> SoftDeleteUser(Guid id)
    {
        var command = new DeleteUserCommand(id);

        try
        {
            var response = await mediator.Send(command);

            if (!response.Success)
            {
                if (response.Message?.Contains("not found") == true)
                    return NotFound(ApiResponse.ErrorResult(ErrorCodes.UserNotFound, response.Message));

                if (response.Message != null)
                    return BadRequest(ApiResponse.ErrorResult(ErrorCodes.BusinessLogicError, response.Message));
            }

            return HandleResult(response);
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpPost("import")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ApiResponse<ImportUsersResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ImportUsers(IFormFile file, CancellationToken cancellationToken)
    {
        if (file.Length == 0)
            return BadRequest(ApiResponse.ErrorResult(ErrorCodes.InvalidInput, ErrorMessages.InvalidInput));

        List<UserImportDto> usersToImport;
        try
        {
            // Sử dụng service generic mới
            usersToImport = await fileProcessor.ProcessFileAsync(file, cancellationToken);
        }
        catch (InvalidFileFormatException ex)
        {
            return BadRequest(ApiResponse.ErrorResult(ErrorCodes.InvalidFileFormat, ex.Message));
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }

        if (!usersToImport.Any())
            return BadRequest(ApiResponse.ErrorResult(ErrorCodes.InvalidInput, ErrorMessages.InvalidInput));

        var command = new ImportUsersCommand(usersToImport);

        try
        {
            var response = await mediator.Send(command, cancellationToken);

            if (response.Success)
                // Sử dụng HandleResult thay cho HandleCreated vì không tạo một resource mới duy nhất
                return HandleResult(response, "Import successful.");

            return HandlePartialSuccess(response,
                $"Imported {response.ImportedCount} users successfully.",
                $"There were {response.FailedCount} errors in the file input.");
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }


    [HttpPut("{id}/status")]
    [ProducesResponseType(typeof(ApiResponse<UpdateUserStatusResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UpdateUserStatus(Guid id, [FromBody] UpdateUserStatusRequest request)
    {
        var command = new UpdateUserStatusCommand(id, request);

        try
        {
            var response = await mediator.Send(command);
            return HandleResult(response);
        }
        catch (ResourceNotFoundException ex)
        {
            return NotFound(ApiResponse.ErrorResult(ErrorCodes.UserNotFound, ex.Message));
        }
        catch (BusinessRuleException ex)
        {
            return BadRequest(ApiResponse.ErrorResult(ErrorCodes.BusinessLogicError, ex.Message));
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }
}