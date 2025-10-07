namespace Zentry.SharedKernel.Abstractions.Models;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public ApiError? Error { get; set; }
    public string? Message { get; set; }

    public static ApiResponse<T> SuccessResult(T data, string? message = null)
    {
        return new ApiResponse<T>
        {
            Success = true,
            Data = data,
            Message = message
        };
    }

    public static ApiResponse<T> ErrorResult(string errorCode, string message)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Error = new ApiError
            {
                Code = errorCode,
                Message = message
            }
        };
    }
}

public class ApiResponse
{
    public bool Success { get; set; }
    public ApiError? Error { get; set; }
    public string? Message { get; set; }

    public static ApiResponse SuccessResult(string? message = null)
    {
        return new ApiResponse
        {
            Success = true,
            Message = message
        };
    }

    public static ApiResponse ErrorResult(string errorCode, string message)
    {
        return new ApiResponse
        {
            Success = false,
            Error = new ApiError
            {
                Code = errorCode,
                Message = message
            }
        };
    }
}

public class ApiError
{
    public string Code { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}