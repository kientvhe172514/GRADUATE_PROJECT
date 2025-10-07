using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Zentry.SharedKernel.Abstractions.Models;
using Zentry.SharedKernel.Constants.Response;
using Zentry.SharedKernel.Exceptions;
using Zentry.SharedKernel.Helpers;

namespace Zentry.SharedKernel.Extensions;

[ApiController]
public abstract class BaseController : ControllerBase
{
    // Success response methods
    protected IActionResult HandleResult<T>(T data, string? message = null)
    {
        return Ok(ApiResponse<T>.SuccessResult(data, message));
    }

    protected IActionResult HandleResult(string? message = null)
    {
        return Ok(ApiResponse.SuccessResult(message));
    }

    protected IActionResult HandleCreated<T>(T data, string actionName, object? routeValues = null,
        string? message = null)
    {
        var response = ApiResponse<T>.SuccessResult(data, message ?? "Resource created successfully");
        return CreatedAtAction(actionName, routeValues, response);
    }

    protected IActionResult HandleNoContent()
    {
        return NoContent();
    }

    protected IActionResult HandleError(Exception ex)
    {
        LogException(ex);

        return ex switch
        {
            InvalidCredentialsException =>
                StatusCode(401,
                    ApiResponse.ErrorResult(ErrorCodes.InvalidCredentials,
                        ErrorMessages.Authentication.InvalidCredentials)),

            AccountInactiveException =>
                StatusCode(401,
                    ApiResponse.ErrorResult(ErrorCodes.AccountInactive, ErrorMessages.Authentication.AccountInactive)),

            AccountLockedException =>
                StatusCode(401,
                    ApiResponse.ErrorResult(ErrorCodes.AccountLocked, ErrorMessages.Authentication.AccountLocked)),

            AccountDisabledException =>
                StatusCode(401,
                    ApiResponse.ErrorResult(ErrorCodes.AccountDisabled, ErrorMessages.Authentication.AccountDisabled)),

            TokenExpiredException =>
                StatusCode(401,
                    ApiResponse.ErrorResult(ErrorCodes.TokenExpired, ErrorMessages.Authentication.TokenExpired)),

            // User management specific exceptions
            UserNotFoundException =>
                NotFound(ApiResponse.ErrorResult(ErrorCodes.UserNotFound, ex.Message)),

            UserAlreadyExistsException =>
                Conflict(ApiResponse.ErrorResult(ErrorCodes.UserAlreadyExists, ex.Message)),

            AccountNotFoundException =>
                NotFound(ApiResponse.ErrorResult(ErrorCodes.AccountNotFound,
                    ErrorMessages.Authentication.AccountNotFound)),

            // Resource exceptions
            ResourceNotFoundException =>
                NotFound(ApiResponse.ErrorResult(ErrorCodes.ResourceNotFound, ex.Message)),

            ResourceAlreadyExistsException =>
                Conflict(ApiResponse.ErrorResult(ErrorCodes.ResourceAlreadyExists, ex.Message)),

            // Schedule management exceptions
            ScheduleConflictException =>
                Conflict(ApiResponse.ErrorResult(ErrorCodes.ScheduleConflict, ex.Message)),

            ResourceCannotBeDeletedException =>
                BadRequest(ApiResponse.ErrorResult(ErrorCodes.CourseCannotBeDeleted, ex.Message)),

            ClassSectionNotFoundException =>
                NotFound(ApiResponse.ErrorResult(ErrorCodes.ClassSectionNotFound, ex.Message)),

            RoomNotAvailableException =>
                Conflict(ApiResponse.ErrorResult(ErrorCodes.RoomNotAvailable, ex.Message)),

            // Device management exceptions
            DeviceAlreadyRegisteredException =>
                Conflict(ApiResponse.ErrorResult(ErrorCodes.DeviceAlreadyRegistered, ex.Message)),

            // Attendance exceptions
            SessionNotFoundException =>
                NotFound(ApiResponse.ErrorResult(ErrorCodes.SessionNotFound, ex.Message)),

            SessionAlreadyStartedException =>
                Conflict(ApiResponse.ErrorResult(ErrorCodes.SessionAlreadyStarted, ex.Message)),

            AttendanceCalculationFailedException =>
                BadRequest(ApiResponse.ErrorResult(ErrorCodes.AttendanceCalculationFailed, ex.Message)),

            // Configuration exceptions
            ConfigurationException =>
                StatusCode(500, ApiResponse.ErrorResult(ErrorCodes.ConfigurationError, ex.Message)),

            SettingNotFoundException =>
                NotFound(ApiResponse.ErrorResult(ErrorCodes.SettingNotFound, ex.Message)),

            // FluentValidation exceptions
            ValidationException validationEx =>
                HandleFluentValidationException(validationEx),
            InvalidAttributeDefinitionTypeException =>
                BadRequest(ApiResponse.ErrorResult(ErrorCodes.InvalidAttributeDefinitionType, ex.Message)),
            AttributeDefinitionKeyAlreadyExistsException =>
                Conflict(ApiResponse.ErrorResult(ErrorCodes.AttributeDefinitionKeyExists, ex.Message)),
            InvalidSettingValueException =>
                BadRequest(ApiResponse.ErrorResult(ErrorCodes.InvalidSettingValue, ex.Message)),
            InvalidSettingScopeException =>
                BadRequest(ApiResponse.ErrorResult(ErrorCodes.InvalidSettingScope, ex.Message)),
            SelectionDataTypeRequiresOptionsException =>
                BadRequest(ApiResponse.ErrorResult(ErrorCodes.SelectionOptionsRequired, ex.Message)),
            SettingAlreadyExistsException =>
                Conflict(ApiResponse.ErrorResult(ErrorCodes.SettingAlreadyExists, ex.Message)),
            SessionEndedException =>
                BadRequest(ApiResponse.ErrorResult(ErrorCodes.SessionEnded, ErrorMessages.Attendance.SessionEnded)),
            BusinessRuleException businessEx =>
                BadRequest(ApiResponse.ErrorResult(ErrorCodes.BusinessRuleError, businessEx.Message)),
            // General business logic exceptions
            BusinessLogicException =>
                BadRequest(ApiResponse.ErrorResult(ErrorCodes.BusinessLogicError, ex.Message)),

            // Standard .NET exceptions with better handling
            UnauthorizedAccessException =>
                HandleUnauthorizedAccessException(ex),

            InvalidOperationException =>
                BadRequest(ApiResponse.ErrorResult(ErrorCodes.InvalidOperation, ex.Message)),

            ArgumentException =>
                BadRequest(ApiResponse.ErrorResult(ErrorCodes.ValidationError, ex.Message)),

            DirectoryNotFoundException =>
                NotFound(ApiResponse.ErrorResult(ErrorCodes.ResourceNotFound, ex.Message)),

            FileNotFoundException =>
                NotFound(ApiResponse.ErrorResult(ErrorCodes.ResourceNotFound, ex.Message)),


            // Default case
            _ => StatusCode(500,
                ApiResponse.ErrorResult(ErrorCodes.InternalServerError, "An unexpected error occurred"))
        };
    }

    // Helper methods for specific error handling
    private IActionResult HandleUnauthorizedAccessException(Exception ex)
    {
        // Phân tích message để xác định loại lỗi unauthorized cụ thể
        var message = ex.Message.ToLower();

        if (message.Contains("inactive"))
            return StatusCode(401,
                ApiResponse.ErrorResult(ErrorCodes.AccountInactive, ErrorMessages.Authentication.AccountInactive));

        if (message.Contains("locked"))
            return StatusCode(401,
                ApiResponse.ErrorResult(ErrorCodes.AccountLocked, ErrorMessages.Authentication.AccountLocked));

        if (message.Contains("password") || message.Contains("credential"))
            return StatusCode(401,
                ApiResponse.ErrorResult(ErrorCodes.InvalidCredentials,
                    ErrorMessages.Authentication.InvalidCredentials));

        // Default unauthorized
        return StatusCode(401, ApiResponse.ErrorResult(ErrorCodes.Unauthorized, "Access denied"));
    }

    private IActionResult HandleFluentValidationException(ValidationException validationEx)
    {
        var firstError = validationEx.Errors.FirstOrDefault();
        var message = firstError?.ErrorMessage ?? "Validation failed";

        return BadRequest(ApiResponse.ErrorResult(ErrorCodes.ValidationError, message));
    }

    // Validation helper methods
    protected IActionResult HandleValidationError(string? message = null)
    {
        return BadRequest(ApiResponse.ErrorResult(ErrorCodes.ValidationError,
            message ?? "Invalid request data"));
    }

    protected IActionResult? ValidateRequest<T>(T request, IValidator<T> validator)
    {
        return ValidationHelper.ValidateWithFluentValidation(request, validator);
    }

    // Specific helper methods
    protected IActionResult HandleNotFound(string resourceName, object id)
    {
        return NotFound(ApiResponse.ErrorResult(ErrorCodes.ResourceNotFound,
            $"{resourceName} with ID '{id}' not found"));
    }

    protected IActionResult HandleUserNotFound(object id)
    {
        return NotFound(ApiResponse.ErrorResult(ErrorCodes.UserNotFound,
            $"User with ID '{id}' not found"));
    }

    protected IActionResult HandleConflict(string errorCode, string message)
    {
        return Conflict(ApiResponse.ErrorResult(errorCode, message));
    }

    protected IActionResult HandleBadRequest(string errorCode, string message)
    {
        return BadRequest(ApiResponse.ErrorResult(errorCode, message));
    }

    protected IActionResult HandleInvalidCredentials()
    {
        return StatusCode(401, ApiResponse.ErrorResult(ErrorCodes.InvalidCredentials,
            ErrorMessages.Authentication.InvalidCredentials));
    }

    protected IActionResult HandleAccountNotFound()
    {
        return NotFound(ApiResponse.ErrorResult(ErrorCodes.AccountNotFound,
            ErrorMessages.Authentication.AccountNotFound));
    }

    protected IActionResult HandleAccountInactive()
    {
        return StatusCode(401, ApiResponse.ErrorResult(ErrorCodes.AccountInactive,
            ErrorMessages.Authentication.AccountInactive));
    }

    protected IActionResult HandleAccountLocked()
    {
        return StatusCode(401, ApiResponse.ErrorResult(ErrorCodes.AccountLocked,
            ErrorMessages.Authentication.AccountLocked));
    }

    protected IActionResult HandlePartialSuccess<T>(T data, string? successMessage = null,
        string? failureMessage = null)
    {
        var message = successMessage ?? "Operation completed with partial success";
        if (!string.IsNullOrWhiteSpace(failureMessage)) message += $". {failureMessage}";

        return Ok(ApiResponse<T>.SuccessResult(data, message));
    }

    // Logging method (có thể override trong derived classes)
    protected virtual void LogException(Exception ex)
    {
        // Implement logging logic here
        // Có thể inject ILogger<T> vào derived classes nếu cần
        Console.WriteLine($"Exception occurred: {ex.GetType().Name} - {ex.Message}");
    }
}