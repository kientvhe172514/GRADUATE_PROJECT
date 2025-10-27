import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { LeaveRecordEntity } from '../../../domain/entities/leave-record.entity';
import { ILeaveRecordRepository } from '../../../application/ports/leave-record.repository.interface';
import { LeaveRecordSchema } from '../typeorm/leave-record.schema';

@Injectable()
export class PostgresLeaveRecordRepository implements ILeaveRecordRepository {
  constructor(
    @InjectRepository(LeaveRecordSchema)
    private readonly repository: Repository<LeaveRecordEntity>,
  ) {}

  async findAll(filters?: any): Promise<LeaveRecordEntity[]> {
    return this.repository.find({ 
      where: filters,
      order: { requested_at: 'DESC' }
    });
  }

  async findById(id: number): Promise<LeaveRecordEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByEmployeeId(employeeId: number): Promise<LeaveRecordEntity[]> {
    return this.repository.find({ 
      where: { employee_id: employeeId },
      order: { requested_at: 'DESC' }
    });
  }

  async findByStatus(status: string): Promise<LeaveRecordEntity[]> {
    return this.repository.find({ 
      where: { status },
      order: { requested_at: 'DESC' }
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<LeaveRecordEntity[]> {
    return this.repository
      .createQueryBuilder('leave_record')
      .where('leave_record.start_date <= :endDate', { endDate })
      .andWhere('leave_record.end_date >= :startDate', { startDate })
      .orderBy('leave_record.requested_at', 'DESC')
      .getMany();
  }

  async create(record: Partial<LeaveRecordEntity>): Promise<LeaveRecordEntity> {
    const entity = this.repository.create(record);
    return this.repository.save(entity);
  }

  async update(id: number, record: Partial<LeaveRecordEntity>): Promise<LeaveRecordEntity> {
    await this.repository.update(id, record);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Leave record not found after update');
    }
    return updated;
  }

  async updateStatus(id: number, status: string, approvedBy?: number): Promise<void> {
    const updates: any = { status };
    if (approvedBy) {
      updates.approved_by = approvedBy;
      updates.approved_at = new Date();
    }
    await this.repository.update(id, updates);
  }
}
