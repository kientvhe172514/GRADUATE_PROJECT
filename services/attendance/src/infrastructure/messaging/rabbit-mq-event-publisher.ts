import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { IEventPublisher } from '../../application/ports/event-publisher.port';

@Injectable()
export class RabbitMqEventPublisher implements IEventPublisher {
  private readonly logger = new Logger(RabbitMqEventPublisher.name);

  constructor(
    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationClient: ClientProxy,
  ) {}

  async publish(event: { pattern: string; data: any }): Promise<void> {
    try {
      this.logger.debug(`Publishing event: ${event.pattern}`, event.data);
      
      // Emit event to notification service via RabbitMQ
      this.notificationClient.emit(event.pattern, event.data);
      
      this.logger.log(`✅ Event published: ${event.pattern}`);
    } catch (error) {
      this.logger.error(`❌ Error publishing event ${event.pattern}:`, error);
      throw error;
    }
  }
}
