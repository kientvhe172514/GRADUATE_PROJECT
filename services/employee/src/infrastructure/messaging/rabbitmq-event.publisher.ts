import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { EventPublisherPort } from '../../application/ports/event.publisher.port';

@Injectable()
export class RabbitMQEventPublisher implements EventPublisherPort {
  constructor(@Inject('IAM_SERVICE') private client: ClientProxy) {}

  publish(pattern: string, data: any): void {
    this.client.emit(pattern, data);
  }
}