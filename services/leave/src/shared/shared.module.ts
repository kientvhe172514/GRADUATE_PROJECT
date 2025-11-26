import { Module, Global } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'EMPLOYEE_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          // Make RabbitMQ optional - use default values if not configured
          const rabbitmqUrl = configService.get<string>(
            'RABBITMQ_URL',
            'amqp://localhost:5672',
          );
          const employeeQueue = configService.get<string>(
            'RABBITMQ_EMPLOYEE_QUEUE',
            'employee_queue',
          );
          return {
            transport: Transport.RMQ,
            options: {
              urls: [rabbitmqUrl] as string[],
              queue: employeeQueue,
              queueOptions: {
                durable: true,
              },
              // FIX: PRECONDITION_FAILED - reply consumer cannot acknowledge
              // For RPC pattern, reply queue should use noAck: true
              noAck: true, // Changed from false to true
              prefetchCount: 1,
              persistent: true,
              socketOptions: {
                heartbeatIntervalInSeconds: 60,
                reconnectTimeInSeconds: 5,
              },
            },
          };
        },
        inject: [ConfigService],
      },
      {
        name: 'NOTIFICATION_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          // Make RabbitMQ optional - use default values if not configured
          const rabbitmqUrl = configService.get<string>(
            'RABBITMQ_URL',
            'amqp://localhost:5672',
          );
          const notificationQueue = configService.get<string>(
            'RABBITMQ_NOTIFICATION_QUEUE',
            'notification_queue',
          );
          return {
            transport: Transport.RMQ,
            options: {
              urls: [rabbitmqUrl] as string[],
              queue: notificationQueue,
              queueOptions: {
                durable: true,
              },
              // FIX: PRECONDITION_FAILED - reply consumer cannot acknowledge
              // For RPC pattern, reply queue should use noAck: true
              noAck: true, // Changed from false to true
              prefetchCount: 1,
              persistent: true,
              socketOptions: {
                heartbeatIntervalInSeconds: 60,
                reconnectTimeInSeconds: 5,
              },
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class SharedModule {}
