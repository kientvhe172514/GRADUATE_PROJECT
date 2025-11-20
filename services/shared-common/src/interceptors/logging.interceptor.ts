import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interceptor để tự động log tất cả HTTP requests
 * Thêm request ID, duration, status code
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const requestId = uuidv4();
    
    // Attach request ID to request object
    request.requestId = requestId;
    
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const userId = request.user?.id || request.user?.userId || 'anonymous';
    
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;
          
          // Log request với structured format
          const logData = {
            requestId,
            method,
            url,
            statusCode,
            duration,
            userId,
            ip,
            userAgent,
            type: 'http_request',
          };
          
          if (statusCode >= 400) {
            this.logger.warn(JSON.stringify(logData));
          } else {
            this.logger.log(JSON.stringify(logData));
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;
          
          // Log error request
          const logData = {
            requestId,
            method,
            url,
            statusCode,
            duration,
            userId,
            ip,
            userAgent,
            type: 'http_request',
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
          };
          
          this.logger.error(JSON.stringify(logData));
        },
      }),
    );
  }
}
