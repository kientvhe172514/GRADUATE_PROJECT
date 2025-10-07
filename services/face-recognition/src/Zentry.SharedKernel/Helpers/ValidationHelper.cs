using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Zentry.SharedKernel.Abstractions.Models;
using Zentry.SharedKernel.Constants.Response;

namespace Zentry.SharedKernel.Helpers;

public static class ValidationHelper
{
    public static IActionResult? ValidateWithFluentValidation<T>(T request, IValidator<T> validator)
    {
        if (request == null)
            return new BadRequestObjectResult(
                ApiResponse.ErrorResult(ErrorCodes.ValidationError, ErrorMessages.RequestBodyRequired)
            );

        var validationResult = validator.Validate(request);
        if (validationResult.IsValid) return null;

        var firstError = validationResult.Errors.First();
        return new BadRequestObjectResult(
            ApiResponse.ErrorResult(ErrorCodes.ValidationError, firstError.ErrorMessage)
        );
    }

    // Phương thức cũ vẫn giữ để backward compatibility
    public static IActionResult? ValidateAndReturnError(params (bool condition, string message)[] validations)
    {
        foreach (var (condition, message) in validations)
            if (!condition)
                return new BadRequestObjectResult(
                    ApiResponse.ErrorResult(ErrorCodes.ValidationError, message)
                );

        return null;
    }

    // Validate đơn giản cho các trường hợp cơ bản
    public static IActionResult? ValidateBasic<T>(T request, string? customMessage = null) where T : class
    {
        if (request == null)
            return new BadRequestObjectResult(
                ApiResponse.ErrorResult(ErrorCodes.ValidationError,
                    customMessage ?? ErrorMessages.RequestBodyRequired)
            );

        return null;
    }
}