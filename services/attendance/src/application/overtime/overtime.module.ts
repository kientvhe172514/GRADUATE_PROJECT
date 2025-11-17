import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OvertimeRequestSchema } from '../../infrastructure/persistence/typeorm/overtime-request.schema';
import { OvertimeRequestRepository } from '../../infrastructure/repositories/overtime-request.repository';
import { OvertimeRequestController } from '../../presentation/controllers/overtime-request.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([OvertimeRequestSchema]),
    ClientsModule.registerAsync([
      {
        name: 'NOTIFICATION_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const rabbitmqUrl = configService.getOrThrow<string>('RABBITMQ_URL');
          const notificationQueue = configService.getOrThrow<string>(
            'RABBITMQ_NOTIFICATION_QUEUE',
          );
          return {
            transport: Transport.RMQ,
            options: {
              urls: [rabbitmqUrl],
              queue: notificationQueue,
              queueOptions: {
                durable: true,
              },
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [OvertimeRequestController],
  providers: [OvertimeRequestRepository],
  exports: [OvertimeRequestRepository],
})
export class OvertimeModule {}
