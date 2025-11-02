import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HolidaySchema } from '../../infrastructure/persistence/typeorm/holiday.schema';
import { PostgresHolidayRepository } from '../../infrastructure/persistence/repositories/postgres-holiday.repository';
import { HOLIDAY_REPOSITORY } from '../tokens';
import { HolidayController } from '../../presentation/controllers/holiday.controller';
import { GetHolidaysUseCase } from './use-cases/get-holidays.use-case';
import { GetHolidayByIdUseCase } from './use-cases/get-holiday-by-id.use-case';
import { CreateHolidayUseCase } from './use-cases/create-holiday.use-case';
import { UpdateHolidayUseCase } from './use-cases/update-holiday.use-case';
import { DeleteHolidayUseCase } from './use-cases/delete-holiday.use-case';
import { GetCalendarHolidaysUseCase } from './use-cases/get-calendar-holidays.use-case';
import { BulkCreateHolidaysUseCase } from './use-cases/bulk-create-holidays.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([HolidaySchema])],
  controllers: [HolidayController],
  providers: [
    {
      provide: HOLIDAY_REPOSITORY,
      useClass: PostgresHolidayRepository,
    },
    GetHolidaysUseCase,
    GetHolidayByIdUseCase,
    CreateHolidayUseCase,
    UpdateHolidayUseCase,
    DeleteHolidayUseCase,
    GetCalendarHolidaysUseCase,
    BulkCreateHolidaysUseCase,
  ],
  exports: [HOLIDAY_REPOSITORY],
})
export class HolidayModule {}
