import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MonthlySummaryEntity } from '../../../domain/entities/monthly-summary.entity';
import { IMonthlySummaryRepository } from '../../../application/ports/monthly-summary.repository.interface';
import { MonthlySummarySchema } from '../typeorm/monthly-summary.schema';

@Injectable()
export class PostgresMonthlySummaryRepository implements IMonthlySummaryRepository {
  constructor(
    @InjectRepository(MonthlySummarySchema)
    private readonly repository: Repository<MonthlySummaryEntity>,
  ) {}

  async findAll(filters?: any): Promise<MonthlySummaryEntity[]> {
    return this.repository.find({ 
      where: filters,
      order: { year: 'DESC', month: 'DESC' }
    });
  }

  async findById(id: number): Promise<MonthlySummaryEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByEmployeeAndMonth(
    employeeId: number, 
    year: number, 
    month: number
  ): Promise<MonthlySummaryEntity | null> {
    return this.repository.findOne({
      where: { employee_id: employeeId, year, month }
    });
  }

  async findByDepartmentAndMonth(
    departmentId: number, 
    year: number, 
    month: number
  ): Promise<MonthlySummaryEntity[]> {
    return this.repository.find({
      where: { department_id: departmentId, year, month },
      order: { employee_code: 'ASC' }
    });
  }

  async create(summary: Partial<MonthlySummaryEntity>): Promise<MonthlySummaryEntity> {
    const entity = this.repository.create(summary);
    return this.repository.save(entity);
  }

  async update(id: number, summary: Partial<MonthlySummaryEntity>): Promise<MonthlySummaryEntity> {
    await this.repository.update(id, summary);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Monthly summary not found after update');
    }
    return updated;
  }

  async upsert(summary: Partial<MonthlySummaryEntity>): Promise<MonthlySummaryEntity> {
    if (!summary.employee_id || !summary.year || !summary.month) {
      throw new Error('Employee ID, year, and month are required for upsert');
    }
    
    const existing = await this.findByEmployeeAndMonth(
      summary.employee_id,
      summary.year,
      summary.month
    );

    if (existing) {
      await this.repository.update(existing.id, summary);
      const updated = await this.findById(existing.id);
      if (!updated) {
        throw new Error('Monthly summary not found after update');
      }
      return updated;
    }

    return this.create(summary);
  }
}
