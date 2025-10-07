using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Zentry.Modules.ConfigurationManagement.Features.CreateAttributeDefinition;
using Zentry.Modules.ConfigurationManagement.Features.CreateSetting;
using Zentry.Modules.ConfigurationManagement.Features.DeleteAttributeDefinition;
using Zentry.Modules.ConfigurationManagement.Features.DeleteSetting;
using Zentry.Modules.ConfigurationManagement.Features.GetListAttributeDefinition;
using Zentry.Modules.ConfigurationManagement.Features.GetSettings;
using Zentry.Modules.ConfigurationManagement.Features.SetSessionAttendanceThreshold;
using Zentry.Modules.ConfigurationManagement.Features.UpdateAttributeDefinition;
using Zentry.Modules.ConfigurationManagement.Features.UpdateSetting;
using Zentry.SharedKernel.Abstractions.Models;
using Zentry.SharedKernel.Extensions;

namespace Zentry.Modules.ConfigurationManagement.Controllers;

[ApiController]
[Route("api/configurations")]
[EnableRateLimiting("FixedPolicy")]
public class ConfigurationsController(IMediator mediator) : BaseController
{
    [HttpGet("settings")]
    [ProducesResponseType(typeof(ApiResponse<GetSettingsResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetSettings(
        [FromQuery] GetSettingsQuery query,
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

    [HttpGet("definitions")]
    [ProducesResponseType(typeof(ApiResponse<GetListAttributeDefinitionResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetListAttributeDefinition(
        [FromQuery] GetListAttributeDefinitionQuery query,
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

    #region Session-Specific Operations

    [HttpPost("sessions/{sessionId}/attendance-threshold")]
    [ProducesResponseType(typeof(ApiResponse<SetSessionAttendanceThresholdResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> SetSessionAttendanceThreshold(
        [FromRoute] Guid sessionId,
        [FromBody] SetSessionAttendanceThresholdRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var command = new SetSessionAttendanceThresholdCommand
            {
                SessionId = sessionId,
                ThresholdPercentage = request.ThresholdPercentage
            };

            var response = await mediator.Send(command, cancellationToken);
            return HandleResult(response);
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    #endregion

    #region Delete Operations

    [HttpDelete("definitions/{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAttributeDefinition(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
    {
        try
        {
            var command = new DeleteAttributeDefinitionCommand { AttributeId = id };
            await mediator.Send(command, cancellationToken);
            return HandleNoContent();
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpDelete("settings/{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteSetting(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
    {
        try
        {
            var command = new DeleteSettingCommand { SettingId = id };
            await mediator.Send(command, cancellationToken);
            return HandleNoContent();
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    #endregion

    #region Create Operations

    [HttpPost("definitions")]
    [ProducesResponseType(typeof(ApiResponse<CreateAttributeDefinitionResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateAttributeDefinition(
        [FromBody] CreateAttributeDefinitionRequest request,
        CancellationToken cancellationToken)
    {
        var command = new CreateAttributeDefinitionCommand { Details = request };
        var response = await mediator.Send(command, cancellationToken);
        return HandleCreated(response, nameof(CreateAttributeDefinition), new { id = response.AttributeId });
    }

    [HttpPost("settings")]
    [ProducesResponseType(typeof(ApiResponse<CreateSettingResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateSetting(
        [FromBody] CreateSettingRequest request,
        CancellationToken cancellationToken)
    {
        var command = new CreateSettingCommand { SettingDetails = request };
        var response = await mediator.Send(command, cancellationToken);
        return HandleCreated(response, nameof(CreateSetting), new { id = response.SettingId });
    }

    #endregion

    #region Update Operations

    [HttpPut("definitions/{id}")]
    [ProducesResponseType(typeof(ApiResponse<UpdateAttributeDefinitionResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAttributeDefinition(
        [FromRoute] Guid id,
        [FromBody] UpdateAttributeDefinitionRequest request,
        CancellationToken cancellationToken)
    {
        request.AttributeId = id;
        var command = new UpdateAttributeDefinitionCommand { Details = request };
        var response = await mediator.Send(command, cancellationToken);
        return HandleResult(response);
    }

    [HttpPut("settings/{id}")]
    [ProducesResponseType(typeof(ApiResponse<UpdateSettingResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateSetting(
        [FromRoute] Guid id,
        [FromBody] UpdateSettingRequest request,
        CancellationToken cancellationToken)
    {
        request.SettingId = id;
        var command = new UpdateSettingCommand { SettingDetails = request };
        var response = await mediator.Send(command, cancellationToken);
        return HandleResult(response);
    }

    #endregion
}