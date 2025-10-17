export enum ErrorCodes {
  // General errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  BAD_REQUEST = 'BAD_REQUEST',

  // Auth service errors
  ACCOUNT_ALREADY_EXISTS = 'ACCOUNT_ALREADY_EXISTS',
  ACCOUNT_NOT_FOUND = 'ACCOUNT_NOT_FOUND',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_INACTIVE = 'ACCOUNT_INACTIVE',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  PASSWORD_TOO_WEAK = 'PASSWORD_TOO_WEAK',
  TEMPORARY_PASSWORD_EXPIRED = 'TEMPORARY_PASSWORD_EXPIRED',
  TOO_MANY_LOGIN_ATTEMPTS = 'TOO_MANY_LOGIN_ATTEMPTS',

  // Employee service errors
  EMPLOYEE_ALREADY_EXISTS = 'EMPLOYEE_ALREADY_EXISTS',
  EMPLOYEE_NOT_FOUND = 'EMPLOYEE_NOT_FOUND',
  EMPLOYEE_CODE_ALREADY_EXISTS = 'EMPLOYEE_CODE_ALREADY_EXISTS',
  EMPLOYEE_EMAIL_ALREADY_EXISTS = 'EMPLOYEE_EMAIL_ALREADY_EXISTS',
  DEPARTMENT_NOT_FOUND = 'DEPARTMENT_NOT_FOUND',
  POSITION_NOT_FOUND = 'POSITION_NOT_FOUND',
  MANAGER_NOT_FOUND = 'MANAGER_NOT_FOUND',
  CONTRACT_NOT_FOUND = 'CONTRACT_NOT_FOUND',
  CONTRACT_ALREADY_EXISTS = 'CONTRACT_ALREADY_EXISTS',
  INVALID_HIRE_DATE = 'INVALID_HIRE_DATE',
  INVALID_TERMINATION_DATE = 'INVALID_TERMINATION_DATE',

  // Notification service errors
  NOTIFICATION_NOT_FOUND = 'NOTIFICATION_NOT_FOUND',
  NOTIFICATION_TEMPLATE_NOT_FOUND = 'NOTIFICATION_TEMPLATE_NOT_FOUND',
  INVALID_NOTIFICATION_CHANNEL = 'INVALID_NOTIFICATION_CHANNEL',
  PUSH_TOKEN_INVALID = 'PUSH_TOKEN_INVALID',
  EMAIL_SERVICE_UNAVAILABLE = 'EMAIL_SERVICE_UNAVAILABLE',
  SMS_SERVICE_UNAVAILABLE = 'SMS_SERVICE_UNAVAILABLE',
  PUSH_SERVICE_UNAVAILABLE = 'PUSH_SERVICE_UNAVAILABLE',

  // Database errors
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_ERROR = 'DATABASE_QUERY_ERROR',
  DATABASE_CONSTRAINT_VIOLATION = 'DATABASE_CONSTRAINT_VIOLATION',
  DATABASE_TRANSACTION_ERROR = 'DATABASE_TRANSACTION_ERROR',

  // External service errors
  EXTERNAL_SERVICE_UNAVAILABLE = 'EXTERNAL_SERVICE_UNAVAILABLE',
  EXTERNAL_SERVICE_TIMEOUT = 'EXTERNAL_SERVICE_TIMEOUT',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

  // File upload errors
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',

  // Business logic errors
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  RESOURCE_ALREADY_IN_USE = 'RESOURCE_ALREADY_IN_USE',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
}

export const ErrorMessages: Record<ErrorCodes, string> = {
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

// Default HTTP status code mapping per error code
export const ErrorStatusCode: Record<ErrorCodes, number> = {
  // General errors
  [ErrorCodes.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCodes.VALIDATION_ERROR]: 400,
  [ErrorCodes.UNAUTHORIZED]: 401,
  [ErrorCodes.FORBIDDEN]: 403,
  [ErrorCodes.NOT_FOUND]: 404,
  [ErrorCodes.CONFLICT]: 409,
  [ErrorCodes.BAD_REQUEST]: 400,

  // Auth service errors
  [ErrorCodes.ACCOUNT_ALREADY_EXISTS]: 409,
  [ErrorCodes.ACCOUNT_NOT_FOUND]: 404,
  [ErrorCodes.INVALID_CREDENTIALS]: 401,
  [ErrorCodes.ACCOUNT_LOCKED]: 423, // Locked
  [ErrorCodes.ACCOUNT_INACTIVE]: 403,
  [ErrorCodes.TOKEN_EXPIRED]: 401,
  [ErrorCodes.TOKEN_INVALID]: 400,
  [ErrorCodes.PASSWORD_TOO_WEAK]: 400,
  [ErrorCodes.TEMPORARY_PASSWORD_EXPIRED]: 400,
  [ErrorCodes.TOO_MANY_LOGIN_ATTEMPTS]: 429,

  // Employee service errors
  [ErrorCodes.EMPLOYEE_ALREADY_EXISTS]: 409,
  [ErrorCodes.EMPLOYEE_NOT_FOUND]: 404,
  [ErrorCodes.EMPLOYEE_CODE_ALREADY_EXISTS]: 409,
  [ErrorCodes.EMPLOYEE_EMAIL_ALREADY_EXISTS]: 409,
  [ErrorCodes.DEPARTMENT_NOT_FOUND]: 404,
  [ErrorCodes.POSITION_NOT_FOUND]: 404,
  [ErrorCodes.MANAGER_NOT_FOUND]: 404,
  [ErrorCodes.CONTRACT_NOT_FOUND]: 404,
  [ErrorCodes.CONTRACT_ALREADY_EXISTS]: 409,
  [ErrorCodes.INVALID_HIRE_DATE]: 400,
  [ErrorCodes.INVALID_TERMINATION_DATE]: 400,

  // Notification service errors
  [ErrorCodes.NOTIFICATION_NOT_FOUND]: 404,
  [ErrorCodes.NOTIFICATION_TEMPLATE_NOT_FOUND]: 404,
  [ErrorCodes.INVALID_NOTIFICATION_CHANNEL]: 400,
  [ErrorCodes.PUSH_TOKEN_INVALID]: 400,
  [ErrorCodes.EMAIL_SERVICE_UNAVAILABLE]: 503,
  [ErrorCodes.SMS_SERVICE_UNAVAILABLE]: 503,
  [ErrorCodes.PUSH_SERVICE_UNAVAILABLE]: 503,

  // Database errors
  [ErrorCodes.DATABASE_CONNECTION_ERROR]: 503,
  [ErrorCodes.DATABASE_QUERY_ERROR]: 500,
  [ErrorCodes.DATABASE_CONSTRAINT_VIOLATION]: 400,
  [ErrorCodes.DATABASE_TRANSACTION_ERROR]: 500,

  // External service errors
  [ErrorCodes.EXTERNAL_SERVICE_UNAVAILABLE]: 503,
  [ErrorCodes.EXTERNAL_SERVICE_TIMEOUT]: 504,
  [ErrorCodes.EXTERNAL_SERVICE_ERROR]: 502,

  // File upload errors
  [ErrorCodes.FILE_TOO_LARGE]: 413,
  [ErrorCodes.INVALID_FILE_TYPE]: 400,
  [ErrorCodes.FILE_UPLOAD_FAILED]: 500,
  [ErrorCodes.FILE_NOT_FOUND]: 404,

  // Business logic errors
  [ErrorCodes.INSUFFICIENT_PERMISSIONS]: 403,
  [ErrorCodes.OPERATION_NOT_ALLOWED]: 400,
  [ErrorCodes.RESOURCE_ALREADY_IN_USE]: 409,
  [ErrorCodes.QUOTA_EXCEEDED]: 429,
};