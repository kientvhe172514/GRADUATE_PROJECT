import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RabbitMQEventSubscriber {
  constructor(private configService: ConfigService) {}

  // Configuration for RabbitMQ queue
  // Actual event handling is done via @EventPattern in listener controllers
  getQueueConfig(): { urls: string[]; queue: string } {
    const rabbitUrl = this.configService.get<string>('RABBITMQ_URL') ?? 'amqp://localhost:5672';
    const queue = this.configService.get<string>('RABBITMQ_ATTENDANCE_QUEUE') ?? 'attendance_queue';
    
    return {
      urls: [rabbitUrl],
      queue,
    };
  }
}
