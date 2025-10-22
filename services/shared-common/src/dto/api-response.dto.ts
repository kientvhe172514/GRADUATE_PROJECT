import { ApiProperty } from '@nestjs/swagger';

export enum ResponseStatus {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  WARNING = 'WARNING',
}

export class ApiResponseDto<T = any> {
  @ApiProperty({ enum: ResponseStatus })
  status: ResponseStatus;

  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  message: string;

  @ApiProperty({ required: false })
  data?: T;

  @ApiProperty({ required: false })
  errorCode?: string;

  @ApiProperty({ required: false })
  errorDetails?: string;

  @ApiProperty()
  timestamp: string;

  @ApiProperty({ required: false })
  path: string;

  constructor(
    status: ResponseStatus,
    statusCode: number,
    message: string,
    data?: T,
    errorCode?: string,
    errorDetails?: string,
    path?: string,
  ) {
    this.status = status;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.errorCode = errorCode;
    this.errorDetails = errorDetails;
    this.timestamp = new Date().toISOString();
    this.path = path || '';
  }

  static success<T>(data: T, message = 'OK', statusCode = 200, path?: string, successCode: string = 'SUCCESS'): ApiResponseDto<T> {
    return new ApiResponseDto(ResponseStatus.SUCCESS, statusCode, message, data, successCode, undefined, path);
  }

  static error(message: string, statusCode = 500, errorCode?: string, errorDetails?: string, path?: string): ApiResponseDto<null> {
    return new ApiResponseDto(ResponseStatus.ERROR, statusCode, message, null, errorCode, errorDetails, path);
  }
}
