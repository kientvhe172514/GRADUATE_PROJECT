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
    // Route attendance events to notification service for alerts
    if (pattern.startsWith('attendance.')) {
      this.notificationClient.emit(pattern, data);
    }
    
    // Route violations and anomalies to notification service
    if (pattern.includes('violation') || pattern.includes('anomaly')) {
      this.notificationClient.emit(pattern, data);
    }
    
    // Also notify employee service for attendance data sync
    if (pattern.includes('checked') || pattern.includes('shift-completed')) {
      this.employeeClient.emit(pattern, data);
    }
  }
}
