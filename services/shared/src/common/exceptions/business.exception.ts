import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCodes } from '../enums/error-codes.enum';

export class BusinessException extends HttpException {
  public readonly errorCode: ErrorCodes;
  public readonly errorDetails?: string;

  constructor(
    errorCode: ErrorCodes,
    message?: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    errorDetails?: string
  ) {
    const errorMessage = message || BusinessException.getDefaultMessage(errorCode);
    
    super(
      {
        status: 'ERROR',
        statusCode,
        message: errorMessage,
        errorCode,
        errorDetails,
        timestamp: new Date().toISOString(),
      },
      statusCode
    );

    this.errorCode = errorCode;
    this.errorDetails = errorDetails;
  }

  private static getDefaultMessage(errorCode: ErrorCodes): string {
    const messages: Record<ErrorCodes, string> = {
      // General errors
      [ErrorCodes.INTERNAL_SERVER_ERROR]: 'An internal server error occurred',
      [ErrorCodes.VALIDATION_ERROR]: 'Validation failed',
      [ErrorCodes.UNAUTHORIZED]: 'Unauthorized access',
      [ErrorCodes.FORBIDDEN]: 'Access forbidden',
      [ErrorCodes.NOT_FOUND]: 'Resource not found',
      [ErrorCodes.CONFLICT]: 'Resource conflict',
      [ErrorCodes.BAD_REQUEST]: 'Bad request',

      // Auth service errors
      [ErrorCodes.ACCOUNT_ALREADY_EXISTS]: 'Account already exists',
      [ErrorCodes.ACCOUNT_NOT_FOUND]: 'Account not found',
      [ErrorCodes.INVALID_CREDENTIALS]: 'Invalid credentials',
      [ErrorCodes.ACCOUNT_LOCKED]: 'Account is locked',
      [ErrorCodes.ACCOUNT_INACTIVE]: 'Account is inactive',
      [ErrorCodes.TOKEN_EXPIRED]: 'Token has expired',
      [ErrorCodes.TOKEN_INVALID]: 'Invalid token',
      [ErrorCodes.PASSWORD_TOO_WEAK]: 'Password is too weak',
      [ErrorCodes.TEMPORARY_PASSWORD_EXPIRED]: 'Temporary password has expired',
      [ErrorCodes.TOO_MANY_LOGIN_ATTEMPTS]: 'Too many login attempts',

      // Employee service errors
      [ErrorCodes.EMPLOYEE_ALREADY_EXISTS]: 'Employee already exists',
      [ErrorCodes.EMPLOYEE_NOT_FOUND]: 'Employee not found',
      [ErrorCodes.EMPLOYEE_CODE_ALREADY_EXISTS]: 'Employee code already exists',
      [ErrorCodes.EMPLOYEE_EMAIL_ALREADY_EXISTS]: 'Employee email already exists',
      [ErrorCodes.DEPARTMENT_NOT_FOUND]: 'Department not found',
      [ErrorCodes.POSITION_NOT_FOUND]: 'Position not found',
      [ErrorCodes.MANAGER_NOT_FOUND]: 'Manager not found',
      [ErrorCodes.CONTRACT_NOT_FOUND]: 'Contract not found',
      [ErrorCodes.CONTRACT_ALREADY_EXISTS]: 'Contract already exists',
      [ErrorCodes.INVALID_HIRE_DATE]: 'Invalid hire date',
      [ErrorCodes.INVALID_TERMINATION_DATE]: 'Invalid termination date',

      // Notification service errors
      [ErrorCodes.NOTIFICATION_NOT_FOUND]: 'Notification not found',
      [ErrorCodes.NOTIFICATION_TEMPLATE_NOT_FOUND]: 'Notification template not found',
      [ErrorCodes.INVALID_NOTIFICATION_CHANNEL]: 'Invalid notification channel',
      [ErrorCodes.PUSH_TOKEN_INVALID]: 'Invalid push token',
      [ErrorCodes.EMAIL_SERVICE_UNAVAILABLE]: 'Email service unavailable',
      [ErrorCodes.SMS_SERVICE_UNAVAILABLE]: 'SMS service unavailable',
      [ErrorCodes.PUSH_SERVICE_UNAVAILABLE]: 'Push service unavailable',

      // Database errors
      [ErrorCodes.DATABASE_CONNECTION_ERROR]: 'Database connection error',
      [ErrorCodes.DATABASE_QUERY_ERROR]: 'Database query error',
      [ErrorCodes.DATABASE_CONSTRAINT_VIOLATION]: 'Database constraint violation',
      [ErrorCodes.DATABASE_TRANSACTION_ERROR]: 'Database transaction error',

      // External service errors
      [ErrorCodes.EXTERNAL_SERVICE_UNAVAILABLE]: 'External service unavailable',
      [ErrorCodes.EXTERNAL_SERVICE_TIMEOUT]: 'External service timeout',
      [ErrorCodes.EXTERNAL_SERVICE_ERROR]: 'External service error',

      // File upload errors
      [ErrorCodes.FILE_TOO_LARGE]: 'File is too large',
      [ErrorCodes.INVALID_FILE_TYPE]: 'Invalid file type',
      [ErrorCodes.FILE_UPLOAD_FAILED]: 'File upload failed',
      [ErrorCodes.FILE_NOT_FOUND]: 'File not found',

      // Business logic errors
      [ErrorCodes.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions',
      [ErrorCodes.OPERATION_NOT_ALLOWED]: 'Operation not allowed',
      [ErrorCodes.RESOURCE_ALREADY_IN_USE]: 'Resource already in use',
      [ErrorCodes.QUOTA_EXCEEDED]: 'Quota exceeded',
    };

    return messages[errorCode] || 'Unknown error occurred';
  }
}
