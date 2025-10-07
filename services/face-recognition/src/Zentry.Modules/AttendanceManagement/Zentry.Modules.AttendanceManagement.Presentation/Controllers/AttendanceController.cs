using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Zentry.Modules.AttendanceManagement.Application.Dtos;
using Zentry.Modules.AttendanceManagement.Application.Features.CalculateRoundAttendance;
using Zentry.Modules.AttendanceManagement.Application.Features.CancelSession;
using Zentry.Modules.AttendanceManagement.Application.Features.DeleteSession;
using Zentry.Modules.AttendanceManagement.Application.Features.EndSession;
using Zentry.Modules.AttendanceManagement.Application.Features.GetRoundResult;
using Zentry.Modules.AttendanceManagement.Application.Features.GetSessionFinalAttendance;
using Zentry.Modules.AttendanceManagement.Application.Features.GetSessionInfo;
using Zentry.Modules.AttendanceManagement.Application.Features.GetSessionRounds;
using Zentry.Modules.AttendanceManagement.Application.Features.GetStudentFinalAttendance;
using Zentry.Modules.AttendanceManagement.Application.Features.GetStudentSessions;
using Zentry.Modules.AttendanceManagement.Application.Features.HandleAttendanceUpdateRequest;
using Zentry.Modules.AttendanceManagement.Application.Features.RequestAttendanceUpdate;
using Zentry.Modules.AttendanceManagement.Application.Features.StartSession;
using Zentry.Modules.AttendanceManagement.Application.Features.SubmitScanData;
using Zentry.Modules.AttendanceManagement.Application.Features.UpdateSession;
using Zentry.Modules.AttendanceManagement.Application.Features.UpdateStudentAttendanceStatus;
using Zentry.Modules.AttendanceManagement.Presentation.Requests;
using Zentry.SharedKernel.Abstractions.Models;
using Zentry.SharedKernel.Exceptions;
using Zentry.SharedKernel.Extensions;

namespace Zentry.Modules.AttendanceManagement.Presentation.Controllers;

[ApiController]
[Route("api/attendance")]
[EnableRateLimiting("FixedPolicy")]
public class AttendanceController(IMediator mediator) : BaseController
{
    // Lấy kết quả điểm danh cuối cùng của một sinh viên trong một session
    [HttpGet("sessions/{sessionId}/students/{studentId}/final-result")]
    [ProducesResponseType(typeof(ApiResponse<StudentFinalAttendanceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetStudentFinalAttendance(Guid sessionId, Guid studentId)
    {
        try
        {
            var query = new GetStudentFinalAttendanceQuery(sessionId, studentId);
            var response = await mediator.Send(query);
            return HandleResult(response);
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    // Lấy kết quả điểm danh của một round
    [HttpGet("rounds/{roundId}/result")]
    [ProducesResponseType(typeof(ApiResponse<RoundResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRoundResult(Guid roundId)
    {
        try
        {
            var query = new GetRoundResultQuery(roundId);
            var response = await mediator.Send(query);
            return HandleResult(response);
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpPost("sessions/{sessionId}/rounds/{roundId}/calculate-attendance")]
    [ProducesResponseType(typeof(ApiResponse<CalculateRoundAttendanceResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CalculateRoundAttendance(Guid sessionId, Guid roundId,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return HandleValidationError();
        try
        {
            var command = new CalculateRoundAttendanceCommand(sessionId, roundId);
            var result = await mediator.Send(command, cancellationToken);
            return HandleResult(result, "Attendance calculation completed successfully.");
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    // Lấy danh sách các round trong một session
    [HttpGet("sessions/{sessionId}/rounds")]
    [ProducesResponseType(typeof(ApiResponse<List<RoundAttendanceDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSessionRounds(Guid sessionId, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return HandleValidationError();
        try
        {
            var query = new GetSessionRoundsQuery(sessionId);
            var result = await mediator.Send(query, cancellationToken);
            return HandleResult(result, "Session rounds retrieved successfully.");
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    // Lấy kết quả điểm danh cuối cùng của toàn bộ session
    [HttpGet("sessions/{sessionId}/final")]
    [ProducesResponseType(typeof(ApiResponse<List<FinalAttendanceDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSessionFinalAttendance(Guid sessionId, CancellationToken cancellationToken)
    {
        try
        {
            var query = new GetSessionFinalAttendanceQuery(sessionId);
            var result = await mediator.Send(query, cancellationToken);
            return HandleResult(result, "Final session attendance retrieved successfully.");
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpGet("sessions/{sessionId}/details")]
    [ProducesResponseType(typeof(ApiResponse<FinalSessionDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSessionDetails(Guid sessionId, CancellationToken cancellationToken)
    {
        try
        {
            var sessionInfoTask = await mediator.Send(new GetSessionInfoQuery(sessionId), cancellationToken);
            var finalAttendanceTask =
                await mediator.Send(new GetSessionFinalAttendanceQuery(sessionId), cancellationToken);

            var responseData = new FinalSessionDetailsDto
            {
                SessionInfo = sessionInfoTask,
                Students = finalAttendanceTask
            };

            return HandleResult(responseData);
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpPost("sessions/{sessionId}/start")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> StartSession(Guid sessionId, [FromBody] StartSessionRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return HandleValidationError();

        if (request.UserId == Guid.Empty)
            return BadRequest(ApiResponse.ErrorResult("VALIDATION_ERROR", "User ID is required to start a session."));

        try
        {
            var command = new StartSessionCommand
            {
                SessionId = sessionId,
                LecturerId = request.UserId
            };
            await mediator.Send(command, cancellationToken);
            return HandleResult("Session started successfully.");
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpPost("sessions/{sessionId}/end")]
    [ProducesResponseType(typeof(ApiResponse<EndSessionResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> EndSession(Guid sessionId, [FromBody] EndSessionRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return HandleValidationError();

        if (request.UserId == Guid.Empty)
            return BadRequest(ApiResponse.ErrorResult("VALIDATION_ERROR", "User ID is required to end a session."));

        try
        {
            var command = new EndSessionCommand
            {
                SessionId = sessionId,
                LecturerId = request.UserId
            };
            var response = await mediator.Send(command, cancellationToken);
            return HandleResult(response, "Session ended successfully.");
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpPost("sessions/scan")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> SubmitScanData([FromBody] SubmitScanRequest request)
    {
        try
        {
            var utcTimestamp = request.Timestamp.ToUtcFromVietnamLocalTime();
            var command = new SubmitScanDataCommand(
                request.SubmitterDeviceAndroidId,
                request.SessionId,
                request.ScannedDevices,
                utcTimestamp
            );
            var response = await mediator.Send(command);
            return HandleResult(response.Message);
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpPut("sessions/{sessionId}/students/{studentId}/status")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStudentAttendanceStatus(
        Guid sessionId,
        Guid studentId,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return HandleValidationError();

        try
        {
            var command = new UpdateStudentAttendanceStatusCommand(
                sessionId,
                studentId
            );
            await mediator.Send(command, cancellationToken);
            return HandleNoContent();
        }
        catch (NotFoundException ex)
        {
            return HandleNotFound(ex.Message, studentId);
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpPut("sessions/{sessionId}")]
    [ProducesResponseType(typeof(ApiResponse<UpdateSessionResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateSession(Guid sessionId, [FromBody] UpdateSessionRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return HandleValidationError();
        try
        {
            var command = new UpdateSessionCommand
            {
                SessionId = sessionId,
                LecturerId = request.LecturerId,
                StartTime = request.StartTime,
                EndTime = request.EndTime,
                SessionConfigs = request.SessionConfigs
            };
            var response = await mediator.Send(command, cancellationToken);
            return HandleResult(response, "Session updated successfully.");
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpDelete("sessions/{sessionId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteSession(Guid sessionId, CancellationToken cancellationToken)
    {
        try
        {
            var command = new DeleteSessionCommand { SessionId = sessionId };
            await mediator.Send(command, cancellationToken);
            return HandleNoContent();
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpPost("sessions/{sessionId}/cancel")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CancelSession(Guid sessionId, CancellationToken cancellationToken)
    {
        try
        {
            var command = new CancelSessionCommand { SessionId = sessionId };
            await mediator.Send(command, cancellationToken);
            return HandleNoContent();
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpGet("students/{studentId}/sessions")]
    [ProducesResponseType(typeof(ApiResponse<GetStudentSessionsResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetStudentSessions(Guid studentId, CancellationToken cancellationToken)
    {
        try
        {
            var query = new GetStudentSessionsQuery(studentId);
            var response = await mediator.Send(query, cancellationToken);
            return HandleResult(response);
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpPost("sessions/{sessionId}/students/{studentId}/request-update")]
    [ProducesResponseType(typeof(ApiResponse<RequestAttendanceUpdateResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> RequestAttendanceUpdate(
        Guid sessionId,
        Guid studentId,
        [FromBody] RequestAttendanceUpdateRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var command = new RequestAttendanceUpdateCommand
            {
                StudentId = studentId,
                SessionId = sessionId,
                Reason = request.Reason
            };

            var response = await mediator.Send(command, cancellationToken);
            return HandleResult(response, "Attendance update request submitted successfully.");
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpPut("attendance-request/{userRequestId}/accept")]
    [ProducesResponseType(typeof(ApiResponse<HandleAttendanceUpdateRequestResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AcceptAttendanceUpdateRequest(
        Guid userRequestId,
        CancellationToken cancellationToken)
    {
        var command = new HandleAttendanceUpdateRequestCommand
        {
            UserRequestId = userRequestId,
            IsAccepted = true
        };

        try
        {
            var response = await mediator.Send(command, cancellationToken);
            return HandleResult(response, "Attendance update request accepted successfully.");
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpPut("attendance-request/{userRequestId}/reject")]
    [ProducesResponseType(typeof(ApiResponse<HandleAttendanceUpdateRequestResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RejectAttendanceUpdateRequest(
        Guid userRequestId,
        CancellationToken cancellationToken)
    {
        var command = new HandleAttendanceUpdateRequestCommand
        {
            UserRequestId = userRequestId,
            IsAccepted = false
        };

        try
        {
            var response = await mediator.Send(command, cancellationToken);
            return HandleResult(response, "Attendance update request rejected successfully.");
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }
}