import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccountCreatedHandler } from '../../application/handlers/account-created.handler';

@Injectable()
export class RabbitMQEventSubscriber {
  constructor(
    private configService: ConfigService,
    private accountCreatedHandler: AccountCreatedHandler,
  ) {}

  // Không dùng ClientProxy nữa; handle in listener controller
  // Method này giờ chỉ config, logic handle ở @EventPattern
  getQueueConfig() {
    return {
      urls: [this.configService.get('RABBITMQ_URL')!],
      queue: this.configService.get('RABBITMQ_EMPLOYEE_QUEUE', 'employee_queue'),
    };
  }
}