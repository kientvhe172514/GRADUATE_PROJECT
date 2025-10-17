import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto, ResponseStatus } from '../dto/api-response.dto';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponseDto<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponseDto<T>> {
    const request = context.switchToHttp().getRequest();
    const path = request.url;

    return next.handle().pipe(
      map((data) => {
        // If data is already an ApiResponseDto, return it as is
        if (data && typeof data === 'object' && 'status' in data) {
          return data;
        }

        // Wrap the response data in ApiResponseDto
        return ApiResponseDto.success(
          data,
          'Operation completed successfully',
          200,
          path
        );
      })
    );
  }
}
