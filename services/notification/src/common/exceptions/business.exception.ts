export class BusinessException extends Error {
  public readonly errorCode: string;
  public readonly statusCode: number;
  public readonly errorDetails?: string;

  constructor(
    errorCode: string,
    message: string,
    statusCode: number = 400,
    errorDetails?: string,
  ) {
    super(message);
    this.name = 'BusinessException';
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.errorDetails = errorDetails;
  }
}
