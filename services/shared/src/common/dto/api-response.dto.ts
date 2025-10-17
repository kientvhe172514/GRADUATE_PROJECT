import { ApiProperty } from '@nestjs/swagger';

export enum ResponseStatus {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  WARNING = 'WARNING',
}

export class ApiResponseDto<T = any> {
  @ApiProperty({ 
    enum: ResponseStatus,
    description: 'Response status',
    example: ResponseStatus.SUCCESS 
  })
  status: ResponseStatus;

  @ApiProperty({ 
    description: 'HTTP status code',
    example: 200 
  })
  statusCode: number;

  @ApiProperty({ 
    description: 'Response message',
    example: 'Operation completed successfully' 
  })
  message: string;

  @ApiProperty({ 
    description: 'Response data',
    required: false 
  })
  data?: T;

  @ApiProperty({ 
    description: 'Error code (only for error responses)',
    required: false,
    example: 'EMPLOYEE_NOT_FOUND' 
  })
  errorCode?: string;

  @ApiProperty({ 
    description: 'Error details (only for error responses)',
    required: false,
    example: 'Employee with ID 123 not found' 
  })
  errorDetails?: string;

  @ApiProperty({ 
    description: 'Timestamp of the response',
    example: '2025-01-17T09:58:14.000Z' 
  })
  timestamp: string;

  @ApiProperty({ 
    description: 'Request path',
    example: '/api/employees' 
  })
  path: string;

  constructor(
    status: ResponseStatus,
    statusCode: number,
    message: string,
    data?: T,
    errorCode?: string,
    errorDetails?: string,
    path?: string
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

  static success<T>(
    data: T,
    message: string = 'Operation completed successfully',
    statusCode: number = 200,
    path?: string
  ): ApiResponseDto<T> {
    return new ApiResponseDto(
      ResponseStatus.SUCCESS,
      statusCode,
      message,
      data,
      undefined,
      undefined,
      path
    );
  }

  static error(
    message: string,
    statusCode: number = 500,
    errorCode?: string,
    errorDetails?: string,
    path?: string
  ): ApiResponseDto {
    return new ApiResponseDto(
      ResponseStatus.ERROR,
      statusCode,
      message,
      undefined,
      errorCode,
      errorDetails,
      path
    );
  }

  static warning<T>(
    data: T,
    message: string,
    statusCode: number = 200,
    path?: string
  ): ApiResponseDto<T> {
    return new ApiResponseDto(
      ResponseStatus.WARNING,
      statusCode,
      message,
      data,
      undefined,
      undefined,
      path
    );
  }
}
