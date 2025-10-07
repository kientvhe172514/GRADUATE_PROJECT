using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.Modules.ScheduleManagement.Application.Features.Enrollments.EnrollMultipleStudents;
using Zentry.Modules.ScheduleManagement.Application.Features.Enrollments.EnrollStudent;
using Zentry.Modules.ScheduleManagement.Application.Features.Enrollments.GetEnrollments;
using Zentry.Modules.ScheduleManagement.Application.Features.Enrollments.GetStudentCountBySemester;
using Zentry.Modules.ScheduleManagement.Application.Features.Enrollments.ImportEnrollments;
using Zentry.Modules.ScheduleManagement.Application.Features.Enrollments.RemoveStudentFromClassSection;
using Zentry.SharedKernel.Abstractions.Data;
using Zentry.SharedKernel.Abstractions.Models;
using Zentry.SharedKernel.Exceptions;
using Zentry.SharedKernel.Extensions;

namespace Zentry.Modules.ScheduleManagement.Presentation.Controllers;

[ApiController]
[Route("api/enrollments")]
[EnableRateLimiting("FixedPolicy")]
public class EnrollmentController(IMediator mediator, IFileProcessor<EnrollmentImportDto> fileProcessor)
    : BaseController
{
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<GetEnrollmentsResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetEnrollments([FromQuery] GetEnrollmentsRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var query = new GetEnrollmentsQuery(request);
            var response = await mediator.Send(query, cancellationToken);
            return HandleResult(response, "Enrollments retrieved successfully.");
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpPost("enroll-student")]
    [ProducesResponseType(typeof(ApiResponse<EnrollmentResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> EnrollStudent([FromBody] EnrollStudentRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var command = new EnrollStudentCommand
            {
                ClassSectionId = request.ClassSectionId,
                StudentId = request.StudentId
            };
            var response = await mediator.Send(command, cancellationToken);
            return HandleResult(response, "Student enrolled successfully.");
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpPost("remove-student")]
    [ProducesResponseType(typeof(ApiResponse<EnrollmentResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveStudentFromClassSection(
        [FromBody] RemoveStudentFromClassSectionRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var command = new RemoveStudentFromClassSectionCommand
            {
                ClassSectionId = request.ClassSectionId,
                StudentId = request.StudentId
            };
            await mediator.Send(command, cancellationToken);
            return HandleNoContent();
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpPost("bulk-enroll-students")]
    [ProducesResponseType(typeof(ApiResponse<BulkEnrollmentResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> BulkEnrollStudents([FromBody] BulkEnrollStudentsRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var command = new BulkEnrollStudentsCommand
            {
                ClassSectionId = request.ClassSectionId,
                StudentIds = request.StudentIds
            };
            var response = await mediator.Send(command, cancellationToken);
            return HandleResult(response, "Students bulk enrolled successfully.");
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpGet("student-count/year/{year}")]
    [ProducesResponseType(typeof(ApiResponse<GetStudentCountBySemesterResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetStudentCountByYear(int year, CancellationToken cancellationToken)
    {
        try
        {
            var query = new GetStudentCountBySemesterQuery(year);
            var response = await mediator.Send(query, cancellationToken);
            return HandleResult(response);
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpPost("import")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ApiResponse<ImportEnrollmentsResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ImportEnrollments(IFormFile file, CancellationToken cancellationToken)
    {
        if (file.Length == 0) return BadRequest(ApiResponse.ErrorResult("INVALID_INPUT", "File không được rỗng."));

        List<EnrollmentImportDto> enrollmentsToImport;
        try
        {
            enrollmentsToImport = await fileProcessor.ProcessFileAsync(file, cancellationToken);
        }
        catch (InvalidFileFormatException ex)
        {
            return BadRequest(ApiResponse.ErrorResult("INVALID_FILE_FORMAT", ex.Message));
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }

        if (enrollmentsToImport.Count == 0)
            return BadRequest(ApiResponse.ErrorResult("INVALID_INPUT", "File không chứa dữ liệu hợp lệ."));

        var command = new ImportEnrollmentsCommand(enrollmentsToImport);
        try
        {
            var response = await mediator.Send(command, cancellationToken);
            if (response.Success)
                return HandleResult(response, $"Import thành công {response.ImportedCount} đăng ký.");

            return HandlePartialSuccess(response,
                $"Đã import thành công {response.ImportedCount} đăng ký.",
                $"Có {response.FailedCount} lỗi trong file.");
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }
}