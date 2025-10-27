import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { HolidayEntity } from '../../../domain/entities/holiday.entity';
import { IHolidayRepository } from '../../../application/ports/holiday.repository.interface';
import { HolidaySchema } from '../typeorm/holiday.schema';

@Injectable()
export class PostgresHolidayRepository implements IHolidayRepository {
  constructor(
    @InjectRepository(HolidaySchema)
    private readonly repository: Repository<HolidayEntity>,
  ) {}

  async findAll(): Promise<HolidayEntity[]> {
    return this.repository.find({ order: { holiday_date: 'ASC' } });
  }

  async findById(id: number): Promise<HolidayEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByYear(year: number): Promise<HolidayEntity[]> {
    return this.repository.find({ 
      where: { year, status: 'ACTIVE' },
      order: { holiday_date: 'ASC' }
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<HolidayEntity[]> {
    return this.repository.find({
      where: {
        holiday_date: Between(startDate, endDate),
        status: 'ACTIVE'
      },
      order: { holiday_date: 'ASC' }
    });
  }

  async create(holiday: Partial<HolidayEntity>): Promise<HolidayEntity> {
    const entity = this.repository.create(holiday);
    return this.repository.save(entity);
  }

  async update(id: number, holiday: Partial<HolidayEntity>): Promise<HolidayEntity> {
    await this.repository.update(id, holiday);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Holiday not found after update');
    }
    return updated;
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
