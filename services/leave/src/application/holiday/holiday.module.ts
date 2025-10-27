import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HolidaySchema } from '../../infrastructure/persistence/typeorm/holiday.schema';
import { PostgresHolidayRepository } from '../../infrastructure/persistence/repositories/postgres-holiday.repository';
import { HOLIDAY_REPOSITORY } from '../tokens';

@Module({
  imports: [TypeOrmModule.forFeature([HolidaySchema])],
  controllers: [],
  providers: [
    {
      provide: HOLIDAY_REPOSITORY,
      useClass: PostgresHolidayRepository,
    },
  ],
  exports: [HOLIDAY_REPOSITORY],
})
export class HolidayModule {}
