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
    // Route leave events to notification service for email/push notifications
    if (pattern.startsWith('leave.')) {
      this.notificationClient.emit(pattern, data);
    }
    
    // Also notify employee service for balance updates
    if (pattern.includes('balance') || pattern.includes('approved') || pattern.includes('rejected')) {
      this.employeeClient.emit(pattern, data);
    }
  }
}
