import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { BusinessException } from '../exceptions/business.exception';
import { ErrorCodes } from '../enums/error-codes.enum';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status: number;
    let message: string;
    let errorCode: string;
    let errorDetails: string | undefined;

    if (exception instanceof BusinessException) {
      // Handle custom business exceptions
      status = exception.getStatus();
      message = exception.message;
      errorCode = exception.errorCode;
      errorDetails = exception.errorDetails;
    } else if (exception instanceof HttpException) {
      // Handle standard HTTP exceptions
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        errorCode = this.getErrorCodeFromStatus(status);
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        errorCode = responseObj.errorCode || this.getErrorCodeFromStatus(status);
        errorDetails = responseObj.errorDetails;
      } else {
        message = exception.message;
        errorCode = this.getErrorCodeFromStatus(status);
      }
    } else {
      // Handle unexpected errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unexpected error occurred';
      errorCode = ErrorCodes.INTERNAL_SERVER_ERROR;
      errorDetails = exception instanceof Error ? exception.message : 'Unknown error';
      
      // Log unexpected errors for debugging
      this.logger.error(
        `Unexpected error: ${exception instanceof Error ? exception.stack : exception}`,
        'GlobalExceptionFilter'
      );
    }

    // Log all errors for monitoring
    this.logger.error(
      `Error ${status}: ${message} - ${errorCode} - Path: ${request.url}`,
      'GlobalExceptionFilter'
    );

    const errorResponse = {
      status: 'ERROR',
      statusCode: status,
      message,
      errorCode,
      errorDetails,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }

  private getErrorCodeFromStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCodes.BAD_REQUEST;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCodes.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCodes.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCodes.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCodes.CONFLICT;
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return ErrorCodes.VALIDATION_ERROR;
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return ErrorCodes.INTERNAL_SERVER_ERROR;
      default:
        return ErrorCodes.INTERNAL_SERVER_ERROR;
    }
  }
}
