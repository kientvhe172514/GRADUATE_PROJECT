import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { EventPublisherPort } from '../../application/ports/event.publisher.port';

@Injectable()
export class RabbitMQEventPublisher implements EventPublisherPort {
  constructor(
    @Inject('EMPLOYEE_SERVICE') private employeeClient: ClientProxy,
    @Inject('NOTIFICATION_SERVICE') private notificationClient: ClientProxy,
  ) {}

  publish(pattern: string, data: any): void {
    // Route auth events to notification service
    if (pattern.startsWith('auth.') || pattern === 'device_session_created') {
      this.notificationClient.emit(pattern, data);
      return;
    }
    // default route to employee service for legacy events (account_created)
    this.employeeClient.emit(pattern, data);
  }
}
