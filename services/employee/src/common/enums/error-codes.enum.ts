export enum ErrorCodes {
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  BAD_REQUEST = 'BAD_REQUEST',

  EMPLOYEE_ALREADY_EXISTS = 'EMPLOYEE_ALREADY_EXISTS',
  EMPLOYEE_NOT_FOUND = 'EMPLOYEE_NOT_FOUND',
  EMPLOYEE_CODE_ALREADY_EXISTS = 'EMPLOYEE_CODE_ALREADY_EXISTS',
  EMPLOYEE_EMAIL_ALREADY_EXISTS = 'EMPLOYEE_EMAIL_ALREADY_EXISTS',
  DEPARTMENT_NOT_FOUND = 'DEPARTMENT_NOT_FOUND',
  POSITION_NOT_FOUND = 'POSITION_NOT_FOUND',
  POSITION_CODE_ALREADY_EXISTS = 'POSITION_CODE_ALREADY_EXISTS',
  MANAGER_NOT_FOUND = 'MANAGER_NOT_FOUND',
}

export const ErrorMessages: Record<ErrorCodes, string> = {
  [ErrorCodes.INTERNAL_SERVER_ERROR]: 'An internal server error occurred',
  [ErrorCodes.VALIDATION_ERROR]: 'Validation failed',
  [ErrorCodes.UNAUTHORIZED]: 'Unauthorized access',
  [ErrorCodes.FORBIDDEN]: 'Access forbidden',
  [ErrorCodes.NOT_FOUND]: 'Resource not found',
  [ErrorCodes.CONFLICT]: 'Resource conflict',
  [ErrorCodes.BAD_REQUEST]: 'Bad request',

  [ErrorCodes.EMPLOYEE_ALREADY_EXISTS]: 'Employee already exists',
  [ErrorCodes.EMPLOYEE_NOT_FOUND]: 'Employee not found',
  [ErrorCodes.EMPLOYEE_CODE_ALREADY_EXISTS]: 'Employee code already exists',
  [ErrorCodes.EMPLOYEE_EMAIL_ALREADY_EXISTS]: 'Employee email already exists',
  [ErrorCodes.DEPARTMENT_NOT_FOUND]: 'Department not found',
  [ErrorCodes.POSITION_NOT_FOUND]: 'Position not found',
  [ErrorCodes.POSITION_CODE_ALREADY_EXISTS]: 'Position code already exists',
  [ErrorCodes.MANAGER_NOT_FOUND]: 'Manager not found',
};

export const ErrorStatusCode: Record<ErrorCodes, number> = {
  [ErrorCodes.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCodes.VALIDATION_ERROR]: 400,
  [ErrorCodes.UNAUTHORIZED]: 401,
  [ErrorCodes.FORBIDDEN]: 403,
  [ErrorCodes.NOT_FOUND]: 404,
  [ErrorCodes.CONFLICT]: 409,
  [ErrorCodes.BAD_REQUEST]: 400,

  [ErrorCodes.EMPLOYEE_ALREADY_EXISTS]: 409,
  [ErrorCodes.EMPLOYEE_NOT_FOUND]: 404,
  [ErrorCodes.EMPLOYEE_CODE_ALREADY_EXISTS]: 409,
  [ErrorCodes.EMPLOYEE_EMAIL_ALREADY_EXISTS]: 409,
  [ErrorCodes.DEPARTMENT_NOT_FOUND]: 404,
  [ErrorCodes.POSITION_NOT_FOUND]: 404,
  [ErrorCodes.POSITION_CODE_ALREADY_EXISTS]: 409,
  [ErrorCodes.MANAGER_NOT_FOUND]: 404,
};


