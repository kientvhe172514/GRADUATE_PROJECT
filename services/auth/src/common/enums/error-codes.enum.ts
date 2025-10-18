export enum ErrorCodes {
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  BAD_REQUEST = 'BAD_REQUEST',

  ACCOUNT_ALREADY_EXISTS = 'ACCOUNT_ALREADY_EXISTS',
  ACCOUNT_NOT_FOUND = 'ACCOUNT_NOT_FOUND',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_INACTIVE = 'ACCOUNT_INACTIVE',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  PASSWORD_TOO_WEAK = 'PASSWORD_TOO_WEAK',
  TEMPORARY_PASSWORD_EXPIRED = 'TEMPORARY_PASSWORD_EXPIRED',
  TEMPORARY_PASSWORD_MUST_CHANGE = 'TEMPORARY_PASSWORD_MUST_CHANGE',
  TOO_MANY_LOGIN_ATTEMPTS = 'TOO_MANY_LOGIN_ATTEMPTS',
}

export const ErrorMessages: Record<ErrorCodes, string> = {
  [ErrorCodes.INTERNAL_SERVER_ERROR]: 'An internal server error occurred',
  [ErrorCodes.VALIDATION_ERROR]: 'Validation failed',
  [ErrorCodes.UNAUTHORIZED]: 'Unauthorized access',
  [ErrorCodes.FORBIDDEN]: 'Access forbidden',
  [ErrorCodes.NOT_FOUND]: 'Resource not found',
  [ErrorCodes.CONFLICT]: 'Resource conflict',
  [ErrorCodes.BAD_REQUEST]: 'Bad request',

  [ErrorCodes.ACCOUNT_ALREADY_EXISTS]: 'Account already exists',
  [ErrorCodes.ACCOUNT_NOT_FOUND]: 'Account not found',
  [ErrorCodes.INVALID_CREDENTIALS]: 'Invalid credentials',
  [ErrorCodes.ACCOUNT_LOCKED]: 'Account is locked',
  [ErrorCodes.ACCOUNT_INACTIVE]: 'Account is inactive',
  [ErrorCodes.TOKEN_EXPIRED]: 'Token has expired',
  [ErrorCodes.TOKEN_INVALID]: 'Invalid token',
  [ErrorCodes.PASSWORD_TOO_WEAK]: 'Password is too weak',
  [ErrorCodes.TEMPORARY_PASSWORD_EXPIRED]: 'Temporary password has expired',
  [ErrorCodes.TEMPORARY_PASSWORD_MUST_CHANGE]: 'You must change your temporary password before continuing',
  [ErrorCodes.TOO_MANY_LOGIN_ATTEMPTS]: 'Too many login attempts',
};

export const ErrorStatusCode: Record<ErrorCodes, number> = {
  [ErrorCodes.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCodes.VALIDATION_ERROR]: 400,
  [ErrorCodes.UNAUTHORIZED]: 401,
  [ErrorCodes.FORBIDDEN]: 403,
  [ErrorCodes.NOT_FOUND]: 404,
  [ErrorCodes.CONFLICT]: 409,
  [ErrorCodes.BAD_REQUEST]: 400,

  [ErrorCodes.ACCOUNT_ALREADY_EXISTS]: 409,
  [ErrorCodes.ACCOUNT_NOT_FOUND]: 404,
  [ErrorCodes.INVALID_CREDENTIALS]: 401,
  [ErrorCodes.ACCOUNT_LOCKED]: 423,
  [ErrorCodes.ACCOUNT_INACTIVE]: 403,
  [ErrorCodes.TOKEN_EXPIRED]: 401,
  [ErrorCodes.TOKEN_INVALID]: 400,
  [ErrorCodes.PASSWORD_TOO_WEAK]: 400,
  [ErrorCodes.TEMPORARY_PASSWORD_EXPIRED]: 400,
  [ErrorCodes.TEMPORARY_PASSWORD_MUST_CHANGE]: 403,
  [ErrorCodes.TOO_MANY_LOGIN_ATTEMPTS]: 429,
};


