import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCodes, ErrorStatusCode, ErrorMessages } from '../enums/error-codes.enum';

export class BusinessException extends HttpException {
  public readonly errorCode: ErrorCodes;
  public readonly errorDetails?: string;

  constructor(
    errorCode: ErrorCodes,
    message?: string,
    statusCode?: HttpStatus | number,
    errorDetails?: string
  ) {
    const httpStatus = (statusCode as number) ?? ErrorStatusCode[errorCode] ?? HttpStatus.BAD_REQUEST;
    const errorMessage = message || ErrorMessages[errorCode] || 'Unknown error occurred';
    
    super(
      {
        status: 'ERROR',
        statusCode: httpStatus,
        message: errorMessage,
        errorCode,
        errorDetails,
        timestamp: new Date().toISOString(),
      },
      httpStatus
    );

    this.errorCode = errorCode;
    this.errorDetails = errorDetails;
  }
}
