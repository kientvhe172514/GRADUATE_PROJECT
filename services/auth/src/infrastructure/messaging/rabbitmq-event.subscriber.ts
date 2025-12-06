import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RabbitMQEventSubscriber {
  constructor(private configService: ConfigService) {}

  getQueueConfig() {
    return {
      urls: [this.configService.getOrThrow('RABBITMQ_URL')],
      queue: this.configService.getOrThrow('RABBITMQ_IAM_QUEUE'),
    };
  }
}
