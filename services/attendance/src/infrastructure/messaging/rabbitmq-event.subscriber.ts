import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RabbitMQEventSubscriber {
  constructor(private configService: ConfigService) {}

  // Configuration for RabbitMQ queue
  // Actual event handling is done via @EventPattern in listener controllers
  getQueueConfig() {
    return {
      urls: [this.configService.get('RABBITMQ_URL')!],
      queue: this.configService.get('RABBITMQ_ATTENDANCE_QUEUE', 'attendance_queue'),
    };
  }
}
