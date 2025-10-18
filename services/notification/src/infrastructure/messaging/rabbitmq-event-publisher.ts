import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, ChannelModel, Channel } from 'amqplib';
import { EventPublisherPort } from '../../application/ports/event-publisher.port';

@Injectable()
export class RabbitMQEventPublisher implements EventPublisherPort {
  private readonly logger = new Logger(RabbitMQEventPublisher.name);
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private readonly exchange = 'zentry.events';

  constructor(private readonly configService: ConfigService) {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      const url = this.configService.get<string>(
        'RABBITMQ_URL',
        'amqp://localhost:5672',
      );

      this.connection = await connect(url);
      if (!this.connection) {
        throw new Error('Failed to establish RabbitMQ connection');
      }
      
      this.channel = await this.connection.createChannel();
      if (!this.channel) {
        throw new Error('Failed to create RabbitMQ channel');
      }

      await this.channel.assertExchange(this.exchange, 'topic', {
        durable: true,
      });

      this.logger.log('RabbitMQ connection established');

      // Handle connection errors
      this.connection.on('error', (err) => {
        this.logger.error('RabbitMQ connection error:', err);
        setTimeout(() => this.initialize(), 5000);
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed. Reconnecting...');
        setTimeout(() => this.initialize(), 5000);
      });
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ:', error);
      setTimeout(() => this.initialize(), 5000);
    }
  }

  async publish(eventName: string, data: any): Promise<void> {
    if (!this.channel) {
      this.logger.error('RabbitMQ channel not available');
      return;
    }

    try {
      const message = JSON.stringify({
        eventName,
        data,
        timestamp: new Date().toISOString(),
      });

      const routingKey = eventName.replace(/\./g, '.');

      this.channel.publish(
        this.exchange,
        routingKey,
        Buffer.from(message),
        {
          persistent: true,
          contentType: 'application/json',
        },
      );

      this.logger.log(`Event published: ${eventName}`);
    } catch (error) {
      this.logger.error(`Failed to publish event ${eventName}:`, error);
      throw error;
    }
  }

  async publishBatch(
    events: { eventName: string; data: any }[],
  ): Promise<void> {
    const promises = events.map((event) =>
      this.publish(event.eventName, event.data),
    );
    await Promise.allSettled(promises);
  }

  async close(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
      this.logger.log('RabbitMQ connection closed');
    } catch (error) {
      this.logger.error('Error closing RabbitMQ connection:', error);
    }
  }
}
