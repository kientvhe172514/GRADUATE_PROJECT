import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AttendanceCheckController } from '../../presentation/controllers/attendance-check.controller';
import { AttendanceCheckRecordSchema } from '../../infrastructure/persistence/typeorm/attendance-check-record.schema';
import { EmployeeShiftSchema } from '../../infrastructure/persistence/typeorm/employee-shift.schema';
import { BeaconSchema } from '../../infrastructure/persistence/typeorm/beacon.schema';
import { AttendanceCheckRepository } from '../../infrastructure/repositories/attendance-check.repository';
import { EmployeeShiftRepository } from '../../infrastructure/repositories/employee-shift.repository';
import { BeaconRepository } from '../../infrastructure/repositories/beacon.repository';
import { ValidateBeaconUseCase } from './validate-beacon.use-case';
import { ValidateGpsUseCase } from './validate-gps.use-case';
import { RequestFaceVerificationUseCase } from './request-face-verification.use-case';
import { ProcessFaceVerificationResultUseCase } from './process-face-verification-result.use-case';
import { UpdateEmployeeShiftUseCase } from '../employee-shift/update-employee-shift.use-case';
import { ValidateEmployeeLocationUseCase } from './validate-employee-location.use-case';
import { RabbitMQEventPublisher } from '../../infrastructure/messaging/rabbitmq-event.publisher';
import { PresenceVerificationModule } from '../presence-verification/presence-verification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AttendanceCheckRecordSchema,
      EmployeeShiftSchema,
      BeaconSchema,
    ]),
    ConfigModule,
    PresenceVerificationModule,
    ClientsModule.registerAsync([
      {
        name: 'FACE_RECOGNITION_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const rabbitmqUrl = configService.getOrThrow<string>('RABBITMQ_URL');
          const faceRecognitionQueue =
            configService.get<string>('RABBITMQ_FACE_RECOGNITION_QUEUE') ||
            'face_recognition_queue';
          return {
            transport: Transport.RMQ,
            options: {
              urls: [rabbitmqUrl],
              queue: faceRecognitionQueue,
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
  controllers: [AttendanceCheckController],
  providers: [
    // Repositories
    AttendanceCheckRepository,
    EmployeeShiftRepository,
    BeaconRepository,
    // Use Cases
    ValidateBeaconUseCase,
    ValidateGpsUseCase,
    UpdateEmployeeShiftUseCase,
    RequestFaceVerificationUseCase,
    ProcessFaceVerificationResultUseCase,
    ValidateEmployeeLocationUseCase,
    // Event Publisher
    {
      provide: 'IEventPublisher',
      useClass: RabbitMQEventPublisher,
    },
  ],
  exports: [
    AttendanceCheckRepository,
    EmployeeShiftRepository,
    BeaconRepository,
    ValidateBeaconUseCase,
    ValidateGpsUseCase,
    UpdateEmployeeShiftUseCase,
    RequestFaceVerificationUseCase,
    ProcessFaceVerificationResultUseCase,
    ValidateEmployeeLocationUseCase,
  ],
})
export class AttendanceCheckModule {}
