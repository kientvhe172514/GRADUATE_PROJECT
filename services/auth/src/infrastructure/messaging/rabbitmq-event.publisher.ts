import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { EventPublisherPort } from '../../application/ports/event.publisher.port';

@Injectable()
export class RabbitMQEventPublisher implements EventPublisherPort {
  constructor(
    @Inject('EMPLOYEE_SERVICE') private employeeClient: ClientProxy,
    @Inject('NOTIFICATION_SERVICE') private notificationClient: ClientProxy,
    @Inject('REPORTING_SERVICE') private reportingClient: ClientProxy,
  ) {}

  publish(pattern: string, data: any): void {
    // Route auth events to notification service
    if (pattern.startsWith('auth.') || pattern === 'device_session_created') {
      this.notificationClient.emit(pattern, data);
      return;
    }
    
    // Route account events to multiple services
    if (pattern === 'account_created' || pattern === 'account_updated') {
      // Send to Employee Service (backward compatibility)
      this.employeeClient.emit(pattern, data);
      // Send to Reporting Service (for employees_cache sync)
      this.reportingClient.emit(pattern, data);
      return;
    }
    
    // default route to employee service for legacy events
    this.employeeClient.emit(pattern, data);
  }
}
