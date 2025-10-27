import { HolidayEntity } from '../../domain/entities/holiday.entity';

export interface IHolidayRepository {
  findAll(): Promise<HolidayEntity[]>;
  findById(id: number): Promise<HolidayEntity | null>;
  findByYear(year: number): Promise<HolidayEntity[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<HolidayEntity[]>;
  create(holiday: Partial<HolidayEntity>): Promise<HolidayEntity>;
  update(id: number, holiday: Partial<HolidayEntity>): Promise<HolidayEntity>;
  delete(id: number): Promise<void>;
}
