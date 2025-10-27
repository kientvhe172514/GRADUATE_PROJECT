import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveTypeEntity } from '../../../domain/entities/leave-type.entity';
import { ILeaveTypeRepository } from '../../../application/ports/leave-type.repository.interface';
import { LeaveTypeSchema } from '../typeorm/leave-type.schema';

@Injectable()
export class PostgresLeaveTypeRepository implements ILeaveTypeRepository {
  constructor(
    @InjectRepository(LeaveTypeSchema)
    private readonly repository: Repository<LeaveTypeEntity>,
  ) {}

  async findAll(): Promise<LeaveTypeEntity[]> {
    return this.repository.find({ order: { sort_order: 'ASC' } });
  }

  async findById(id: number): Promise<LeaveTypeEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByCode(code: string): Promise<LeaveTypeEntity | null> {
    return this.repository.findOne({ where: { leave_type_code: code } });
  }

  async findActive(): Promise<LeaveTypeEntity[]> {
    return this.repository.find({ 
      where: { status: 'ACTIVE' },
      order: { sort_order: 'ASC' }
    });
  }

  async create(leaveType: Partial<LeaveTypeEntity>): Promise<LeaveTypeEntity> {
    const entity = this.repository.create(leaveType);
    return this.repository.save(entity);
  }

  async update(id: number, leaveType: Partial<LeaveTypeEntity>): Promise<LeaveTypeEntity> {
    await this.repository.update(id, leaveType);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Leave type not found after update');
    }
    return updated;
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
