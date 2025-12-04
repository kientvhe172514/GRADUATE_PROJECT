import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HolidaySchema } from '../../infrastructure/persistence/typeorm/holiday.schema';
import { PostgresHolidayRepository } from '../../infrastructure/persistence/repositories/postgres-holiday.repository';
import { HOLIDAY_REPOSITORY } from '../tokens';
import { CreateHolidayUseCase } from './use-cases/create-holiday.use-case';
import { UpdateHolidayUseCase } from './use-cases/update-holiday.use-case';
import { DeleteHolidayUseCase } from './use-cases/delete-holiday.use-case';
import { GetHolidayByIdUseCase } from './use-cases/get-holiday-by-id.use-case';
import { GetHolidaysUseCase } from './use-cases/get-holidays.use-case';
import { GetHolidaysByYearUseCase } from './use-cases/get-holidays-by-year.use-case';
import { BulkCreateHolidaysUseCase } from './use-cases/bulk-create-holidays.use-case';
import { HolidayController } from '../../presentation/controllers/holiday.controller';
import { HolidayRpcController } from '../../presentation/controllers/holiday-rpc.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([HolidaySchema]),
    ClientsModule.registerAsync([
      {
        name: 'ATTENDANCE_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL')!],
            queue: 'attendance_queue', // Hardcoded - attendance service queue name
            queueOptions: { durable: true },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [HolidayController, HolidayRpcController],
  providers: [
    {
      provide: HOLIDAY_REPOSITORY,
      useClass: PostgresHolidayRepository,
    },
    CreateHolidayUseCase,
    UpdateHolidayUseCase,
    DeleteHolidayUseCase,
    GetHolidayByIdUseCase,
    GetHolidaysUseCase,
    GetHolidaysByYearUseCase,
    BulkCreateHolidaysUseCase,
  ],
  exports: [
    HOLIDAY_REPOSITORY,
    CreateHolidayUseCase,
    UpdateHolidayUseCase,
    DeleteHolidayUseCase,
    GetHolidayByIdUseCase,
    GetHolidaysUseCase,
    GetHolidaysByYearUseCase,
    BulkCreateHolidaysUseCase,
  ],
})
export class HolidayModule {}
