import { LoggerService, Injectable, Scope } from '@nestjs/common';
import { ConsoleLogger } from '@nestjs/common';

/**
 * Structured Logger cho Elasticsearch/Grafana
 * Output JSON format để Fluentd parse dễ dàng
 */
@Injectable({ scope: Scope.TRANSIENT })
export class StructuredLogger extends ConsoleLogger implements LoggerService {
  private logContext?: string;
  private metadata: Record<string, any> = {};

  constructor(context?: string) {
    super(context);
    this.logContext = context;
  }

  /**
   * Set metadata cho tất cả logs tiếp theo
   */
  setMetadata(metadata: Record<string, any>) {
    this.metadata = { ...this.metadata, ...metadata };
  }

  /**
   * Clear metadata
   */
  clearMetadata() {
    this.metadata = {};
  }

  private formatLogMessage(level: string, message: any, optionalParams: any[]) {
    const timestamp = new Date().toISOString();
    const pid = process.pid;

    // Base log object
    const logObject: Record<string, any> = {
      '@timestamp': timestamp,
      level: level.toUpperCase(),
      message: typeof message === 'string' ? message : JSON.stringify(message),
      context: this.logContext,
      pid,
      ...this.metadata,
    };

    // Add additional params if provided
    if (optionalParams && optionalParams.length > 0) {
      // If first param is Error, extract stack trace
      if (optionalParams[0] instanceof Error) {
        const error = optionalParams[0];
        logObject.error = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        };
      } else if (typeof optionalParams[0] === 'object') {
        // Merge object params
        Object.assign(logObject, optionalParams[0]);
      } else {
        logObject.params = optionalParams;
      }
    }

    return JSON.stringify(logObject);
  }

  log(message: any, ...optionalParams: any[]) {
    console.log(this.formatLogMessage('info', message, optionalParams));
  }

  error(message: any, ...optionalParams: any[]) {
    console.error(this.formatLogMessage('error', message, optionalParams));
  }

  warn(message: any, ...optionalParams: any[]) {
    console.warn(this.formatLogMessage('warn', message, optionalParams));
  }

  debug(message: any, ...optionalParams: any[]) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatLogMessage('debug', message, optionalParams));
    }
  }

  verbose(message: any, ...optionalParams: any[]) {
    if (process.env.NODE_ENV === 'development') {
      console.log(this.formatLogMessage('verbose', message, optionalParams));
    }
  }
}

/**
 * Factory function để tạo logger với context
 */
export function createLogger(context: string): StructuredLogger {
  return new StructuredLogger(context);
}
