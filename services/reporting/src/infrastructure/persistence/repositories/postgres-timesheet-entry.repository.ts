import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { TimesheetEntryEntity } from '../../../domain/entities/timesheet-entry.entity';
import { ITimesheetEntryRepository } from '../../../application/ports/timesheet-entry.repository.interface';
import { TimesheetEntrySchema } from '../typeorm/timesheet-entry.schema';

@Injectable()
export class PostgresTimesheetEntryRepository implements ITimesheetEntryRepository {
  constructor(
    @InjectRepository(TimesheetEntrySchema)
    private readonly repository: Repository<TimesheetEntryEntity>,
  ) {}

  async findAll(filters?: any): Promise<TimesheetEntryEntity[]> {
    return this.repository.find({ 
      where: filters,
      order: { entry_date: 'DESC' }
    });
  }

  async findById(id: number): Promise<TimesheetEntryEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByEmployeeAndDateRange(
    employeeId: number, 
    startDate: Date, 
    endDate: Date
  ): Promise<TimesheetEntryEntity[]> {
    return this.repository.find({
      where: {
        employee_id: employeeId,
        entry_date: Between(startDate, endDate),
      },
      order: { entry_date: 'ASC' }
    });
  }

  async findByDepartmentAndMonth(
    departmentId: number, 
    year: number, 
    month: number
  ): Promise<TimesheetEntryEntity[]> {
    return this.repository.find({
      where: { department_id: departmentId, year, month },
      order: { entry_date: 'ASC' }
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<TimesheetEntryEntity[]> {
    return this.repository.find({
      where: {
        entry_date: Between(startDate, endDate),
      },
      order: { entry_date: 'ASC' }
    });
  }

  async create(entry: Partial<TimesheetEntryEntity>): Promise<TimesheetEntryEntity> {
    const entity = this.repository.create(entry);
    return this.repository.save(entity);
  }

  async update(id: number, entry: Partial<TimesheetEntryEntity>): Promise<TimesheetEntryEntity> {
    await this.repository.update(id, entry);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Timesheet entry not found after update');
    }
    return updated;
  }

  async upsert(entry: Partial<TimesheetEntryEntity>): Promise<TimesheetEntryEntity> {
    if (!entry.employee_id || !entry.entry_date) {
      throw new Error('Employee ID and entry date are required for upsert');
    }
    
    const existing = await this.repository.findOne({
      where: {
        employee_id: entry.employee_id,
        entry_date: entry.entry_date,
      }
    });

    if (existing) {
      await this.repository.update(existing.id, entry);
      const updated = await this.findById(existing.id);
      if (!updated) {
        throw new Error('Timesheet entry not found after update');
      }
      return updated;
    }

    return this.create(entry);
  }
}
