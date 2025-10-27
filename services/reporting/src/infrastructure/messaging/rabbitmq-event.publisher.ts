import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { EventPublisherPort } from '../../application/ports/event.publisher.port';

@Injectable()
export class RabbitMQEventPublisher implements EventPublisherPort {
  constructor(
    @Inject('ATTENDANCE_SERVICE') private attendanceClient: ClientProxy,
    @Inject('LEAVE_SERVICE') private leaveClient: ClientProxy,
  ) {}

  publish(pattern: string, data: any): void {
    // Reporting service mainly publishes to notification service for report exports
    // But we can also publish back to attendance/leave for data requests
    
    if (pattern.includes('attendance')) {
      this.attendanceClient.emit(pattern, data);
    }
    
    if (pattern.includes('leave')) {
      this.leaveClient.emit(pattern, data);
    }
  }
}
