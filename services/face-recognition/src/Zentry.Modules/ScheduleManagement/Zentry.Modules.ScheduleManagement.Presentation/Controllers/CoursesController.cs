using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.Modules.ScheduleManagement.Application.Features.Courses.CreateCourse;
using Zentry.Modules.ScheduleManagement.Application.Features.Courses.DeleteCourse;
using Zentry.Modules.ScheduleManagement.Application.Features.Courses.GetCourseById;
using Zentry.Modules.ScheduleManagement.Application.Features.Courses.GetCourses;
using Zentry.Modules.ScheduleManagement.Application.Features.Courses.GetLecturerSemesterCourses;
using Zentry.Modules.ScheduleManagement.Application.Features.Courses.GetTopCoursesWithClassSectionCount;
using Zentry.Modules.ScheduleManagement.Application.Features.Courses.GetTotalCourseCount;
using Zentry.Modules.ScheduleManagement.Application.Features.Courses.UpdateCourse;
using Zentry.SharedKernel.Abstractions.Models;
using Zentry.SharedKernel.Extensions;

namespace Zentry.Modules.ScheduleManagement.Presentation.Controllers;

[ApiController]
[Route("api/courses")]
[EnableRateLimiting("FixedPolicy")]
public class CoursesController(IMediator mediator) : BaseController
{
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<GetCoursesResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetCourses([FromQuery] GetCoursesQuery query, CancellationToken cancellationToken)
    {
        try
        {
            var response = await mediator.Send(query, cancellationToken);
            return HandleResult(response, "Courses retrieved successfully.");
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<CourseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCourseById(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var query = new GetCourseByIdQuery(id);
            var response = await mediator.Send(query, cancellationToken);
            return HandleResult(response, "Course retrieved successfully.");
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<CourseCreatedResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateCourse([FromBody] CreateCourseCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var response = await mediator.Send(request, cancellationToken);
            return HandleCreated(response, nameof(CreateCourse), new { id = response.Id });
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<CourseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateCourse(Guid id, [FromBody] UpdateCourseRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var command = new UpdateCourseCommand(id, request);
            var response = await mediator.Send(command, cancellationToken);
            return HandleResult(response, "Course updated successfully.");
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteCourse(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var command = new DeleteCourseCommand(id);
            await mediator.Send(command, cancellationToken);
            return HandleNoContent();
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpGet("lecturer/{lecturerId}/semesters/{semester}")]
    [ProducesResponseType(typeof(GetLecturerSemesterCoursesResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetLecturerSemesterCourses(
        [FromRoute] Guid lecturerId,
        [FromRoute] string semester)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(semester)) return BadRequest("Semester parameter is required.");

            var query = new GetLecturerSemesterCoursesQuery
            {
                LecturerId = lecturerId,
                Semester = semester
            };

            var result = await mediator.Send(query);

            return HandleResult(result);
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpGet("total-courses")]
    public async Task<IActionResult> GetTotalCourses(CancellationToken cancellationToken)
    {
        try
        {
            var count = await mediator.Send(new GetTotalCourseCountQuery(), cancellationToken);
            return HandleResult(count);
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }

    [HttpGet("top-courses")]
    public async Task<IActionResult> GetTopCoursesWithClassSectionCount([FromQuery] int count = 5,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = new GetTopCoursesWithClassSectionCountQuery(count);
            var result = await mediator.Send(query, cancellationToken);
            return HandleResult(result);
        }
        catch (Exception ex)
        {
            return HandleError(ex);
        }
    }
}