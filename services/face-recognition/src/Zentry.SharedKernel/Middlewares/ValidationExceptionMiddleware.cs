using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Zentry.SharedKernel.Abstractions.Models;
using Zentry.SharedKernel.Constants.Response;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.SharedKernel.Middlewares;

public class ValidationExceptionMiddleware(RequestDelegate next, ILogger<ValidationExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var response = context.Response;
        response.ContentType = "application/json";

        var (statusCode, apiResponse) = GetErrorResponse(exception);
        response.StatusCode = statusCode;

        LogException(exception);

        var jsonResponse = JsonSerializer.Serialize(apiResponse, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        });

        await response.WriteAsync(jsonResponse);
    }

    private (int statusCode, ApiResponse apiResponse) GetErrorResponse(Exception exception)
    {
        return exception switch
        {
            // Critical application-specific exceptions (specific before general BusinessLogicException)
            InvalidCredentialsException =>
                (401, ApiResponse.ErrorResult(ErrorCodes.InvalidCredentials, exception.Message)),
            AccountInactiveException =>
                (403, ApiResponse.ErrorResult(ErrorCodes.AccountInactive, exception.Message)),
            AccountLockedException =>
                (403, ApiResponse.ErrorResult(ErrorCodes.AccountLocked, exception.Message)),
            AccountDisabledException =>
                (403, ApiResponse.ErrorResult(ErrorCodes.AccountDisabled, exception.Message)),
            TokenExpiredException =>
                (401, ApiResponse.ErrorResult(ErrorCodes.TokenExpired, exception.Message)),

            // Conflict errors (HTTP 409) - specific
            UserAlreadyExistsException =>
                (409, ApiResponse.ErrorResult(ErrorCodes.UserAlreadyExists, exception.Message)),
            ResourceAlreadyExistsException =>
                (409, ApiResponse.ErrorResult(ErrorCodes.ResourceAlreadyExists, exception.Message)),
            ScheduleConflictException =>
                (409, ApiResponse.ErrorResult(ErrorCodes.ScheduleConflict, exception.Message)),
            RoomNotAvailableException =>
                (409, ApiResponse.ErrorResult(ErrorCodes.RoomNotAvailable, exception.Message)),
            DeviceAlreadyRegisteredException =>
                (409, ApiResponse.ErrorResult(ErrorCodes.DeviceAlreadyRegistered, exception.Message)),
            SessionAlreadyStartedException =>
                (409, ApiResponse.ErrorResult(ErrorCodes.SessionAlreadyStarted, exception.Message)),


            // Not Found errors (HTTP 404) - specific
            UserNotFoundException =>
                (404, ApiResponse.ErrorResult(ErrorCodes.UserNotFound, exception.Message)),
            AccountNotFoundException =>
                (404, ApiResponse.ErrorResult(ErrorCodes.AccountNotFound, exception.Message)),
            ClassSectionNotFoundException =>
                (404, ApiResponse.ErrorResult(ErrorCodes.ClassSectionNotFound, exception.Message)),
            SessionNotFoundException =>
                (404, ApiResponse.ErrorResult(ErrorCodes.SessionNotFound, exception.Message)),
            SettingNotFoundException =>
                (404, ApiResponse.ErrorResult(ErrorCodes.SettingNotFound, exception.Message)),
            // General NotFoundException (if you use it instead of specific ones sometimes)
            NotFoundException notFoundEx =>
                (404, ApiResponse.ErrorResult(ErrorCodes.ResourceNotFound, notFoundEx.Message)),
            DirectoryNotFoundException => // Standard .NET Exception
                (404, ApiResponse.ErrorResult(ErrorCodes.ResourceNotFound, exception.Message)),
            FileNotFoundException => // Standard .NET Exception
                (404, ApiResponse.ErrorResult(ErrorCodes.ResourceNotFound, exception.Message)),
            DuplicateOptionLabelException =>
                (400, ApiResponse.ErrorResult(ErrorCodes.DuplicateOptionLabel, exception.Message)),

            // Bad Request / Business Logic errors (HTTP 400) - specific
            AttendanceCalculationFailedException =>
                (400, ApiResponse.ErrorResult(ErrorCodes.AttendanceCalculationFailed, exception.Message)),
            BusinessRuleException =>
                (400, ApiResponse.ErrorResult(ErrorCodes.BusinessRuleError, exception.Message)),
            // Server Errors (HTTP 500)
            ConfigurationException => // Specific configuration issues are internal server errors
                (500, ApiResponse.ErrorResult(ErrorCodes.ConfigurationError, exception.Message)),
            IntegrationException =>
                (500, ApiResponse.ErrorResult(ErrorCodes.InternalServerError, "An integration error occurred.")),
            // General Business Logic Exception (catch-all for custom business exceptions)
            // This must come AFTER all specific BusinessLogicException derived classes
            BusinessLogicException =>
                (400, ApiResponse.ErrorResult(ErrorCodes.BusinessLogicError, exception.Message)),

            // Standard .NET exceptions that often map to 400
            InvalidOperationException =>
                (400, ApiResponse.ErrorResult(ErrorCodes.InvalidOperation, exception.Message)),
            ArgumentException argEx when IsGuidFormatError(argEx) =>
                (400,
                    CreateValidationErrorResponse(
                        "ID phải có định dạng GUID hợp lệ (ví dụ: 12345678-1234-1234-1234-123456789abc)")),
            ArgumentException => // General ArgumentException
                (400, ApiResponse.ErrorResult(ErrorCodes.ValidationError, exception.Message)),
            JsonException => // JSON parsing errors
                (400, ApiResponse.ErrorResult(ErrorCodes.ValidationError, "Invalid JSON format")),

            // Unauthorized (HTTP 401)
            UnauthorizedAccessException =>
                (401, ApiResponse.ErrorResult(ErrorCodes.Unauthorized, "Access denied.")),


            // Default case: Catch any other unhandled exceptions
            _ => (500, ApiResponse.ErrorResult(ErrorCodes.InternalServerError, "An unexpected error occurred."))
        };
    }

    private static bool IsGuidFormatError(ArgumentException ex)
    {
        // Kiểm tra kỹ hơn để tránh bắt nhầm ArgumentException không phải do GUID
        return (ex.Message.Contains("GUID") && ex.Message.Contains("format")) ||
               (ex.Message.Contains("is not a valid") && ex.ParamName != null &&
                (ex.ParamName.ToLower().Contains("id") || ex.ParamName.ToLower().Contains("guid")));
    }


    private static ApiResponse CreateValidationErrorResponse(string message)
    {
        return ApiResponse.ErrorResult(ErrorCodes.ValidationError, message);
    }

    private void LogException(Exception exception)
    {
        switch (exception)
        {
            // Critical application-specific exceptions (Security/Auth) - Error/Critical level
            case InvalidCredentialsException:
            case AccountInactiveException:
            case AccountLockedException:
            case AccountDisabledException:
            case TokenExpiredException:
            case UnauthorizedAccessException: // This is a standard .NET exception for auth
                logger.LogError(exception, "Security/Authentication error occurred: {Message}", exception.Message);
                break;

            // Conflict errors (Business conflicts) - Warning level
            case UserAlreadyExistsException:
            case ResourceAlreadyExistsException:
            case ScheduleConflictException:
            case RoomNotAvailableException:
            case DeviceAlreadyRegisteredException:
            case SessionAlreadyStartedException:
                logger.LogWarning(exception, "Conflict error occurred: {Message}", exception.Message);
                break;

            // Not Found errors - Warning level
            case UserNotFoundException:
            case AccountNotFoundException:
            case ClassSectionNotFoundException:
            case SessionNotFoundException:
            case SettingNotFoundException:
            case NotFoundException: // General not found
            case DirectoryNotFoundException: // Standard .NET exception
            case FileNotFoundException: // Standard .NET exception
                logger.LogWarning(exception, "Resource not found error occurred: {Message}", exception.Message);
                break;

            // Validation errors (client input issues) - Information level
            case ArgumentException
                : // This will catch the GUID format error as well if not caught by specific validation
            case JsonException: // Standard .NET exception for JSON parsing issues
                logger.LogInformation(exception, "Validation error occurred: {Message}", exception.Message);
                break;
            case DuplicateOptionLabelException: // Log lỗi này ở mức Information hoặc Warning
                logger.LogWarning(exception, "Validation error occurred: {Message}", exception.Message);
                break;
            // Business rule violations or logic issues - Warning level (unless critical)
            case BusinessRuleException: // Catch specific business rules
            case AttendanceCalculationFailedException: // Specific business logic that's a bad request
            case InvalidOperationException: // Standard .NET Invalid Operation
                logger.LogWarning(exception, "Business logic/Rule violation occurred: {Message}", exception.Message);
                break;

            // System errors (internal server issues) - Error level
            case ConfigurationException:
                logger.LogError(exception, "System configuration error occurred: {Message}", exception.Message);
                break;
            case IntegrationException:
                logger.LogError(exception, "Internal integration error occurred: {Message}", exception.Message);
                break;
            // General BusinessLogicException (catch-all for custom business exceptions not covered above)
            // This should be after all specific custom exceptions
            case BusinessLogicException:
                logger.LogWarning(exception, "General business logic exception occurred: {Message}", exception.Message);
                break;

            // Default case: Catch any other unhandled exceptions - Error level
            default:
                logger.LogError(exception, "An unexpected unhandled error occurred: {Message}", exception.Message);
                break;
        }
    }
}

// Extension method để đăng ký middleware
public static class ValidationExceptionMiddlewareExtensions
{
    public static IApplicationBuilder UseValidationExceptionMiddleware(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<ValidationExceptionMiddleware>();
    }
}