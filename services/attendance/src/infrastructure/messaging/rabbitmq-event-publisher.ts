import { Injectable } from '@nestjs/common';
import { IEventPublisher } from '../../application/ports/event-publisher.port';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';

/**
 * RabbitMQ Event Publisher Implementation
 * 
 * Publishes domain events to RabbitMQ message broker
 */
@Injectable()
export class RabbitMQEventPublisher implements IEventPublisher {
  constructor(
    @Inject('RABBITMQ_CLIENT')
    private readonly rabbitMQClient: ClientProxy,
  ) {}

  async publish(event: { pattern: string; data: any }): Promise<void> {
    await this.rabbitMQClient.emit(event.pattern, event.data);
  }
}
